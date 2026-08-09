#include <ass/ass.h>
#include <png.h>

#include <errno.h>
#include <limits.h>
#include <stdint.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>

#define MAX_CAPTION_BYTES 1024
#define MAX_SCRIPT_BYTES 8192

static void discard_libass_message(int level, const char *format, va_list arguments, void *data) {
    (void)level;
    (void)format;
    (void)arguments;
    (void)data;
}

static int parse_int(const char *value, int minimum, int maximum, int *output) {
    char *end = NULL;
    errno = 0;
    long parsed = strtol(value, &end, 10);
    if (errno || !end || *end || parsed < minimum || parsed > maximum) return 0;
    *output = (int)parsed;
    return 1;
}

static unsigned char ascii_lower(unsigned char value) {
    return value >= 'A' && value <= 'Z' ? (unsigned char)(value + ('a' - 'A')) : value;
}

static int contains_ascii_token(const unsigned char *value, size_t length,
                                const char *token, int case_insensitive) {
    size_t token_length = strlen(token);
    if (!token_length || token_length > length) return 0;
    for (size_t start = 0; start + token_length <= length; start++) {
        int matches = 1;
        for (size_t offset = 0; offset < token_length; offset++) {
            unsigned char actual = value[start + offset];
            unsigned char expected = (unsigned char)token[offset];
            if (case_insensitive) {
                actual = ascii_lower(actual);
                expected = ascii_lower(expected);
            }
            if (actual != expected) { matches = 0; break; }
        }
        if (matches) return 1;
    }
    return 0;
}

static int unsafe_text_syntax(const unsigned char *value, size_t length) {
    static const char *case_insensitive_tokens[] = {
        "http://", "https://", "file:", "data:", "javascript:"
    };
    static const char *exact_tokens[] = { "../", "$(", "`", "&&", "||", "#!" };
    for (size_t index = 0; index < sizeof(case_insensitive_tokens) / sizeof(case_insensitive_tokens[0]); index++)
        if (contains_ascii_token(value, length, case_insensitive_tokens[index], 1)) return 1;
    for (size_t index = 0; index < sizeof(exact_tokens) / sizeof(exact_tokens[0]); index++)
        if (contains_ascii_token(value, length, exact_tokens[index], 0)) return 1;
    return 0;
}

static int decode_utf8_code_point(const unsigned char *value, size_t length,
                                  size_t *offset, uint32_t *code_point) {
    unsigned char first = value[*offset];
    if (first <= 0x7f) { *code_point = first; (*offset)++; return 1; }
    if (first >= 0xc2 && first <= 0xdf) {
        if (*offset + 1 >= length || (value[*offset + 1] & 0xc0) != 0x80) return 0;
        *code_point = ((uint32_t)(first & 0x1f) << 6) | (uint32_t)(value[*offset + 1] & 0x3f);
        *offset += 2; return 1;
    }
    if (first >= 0xe0 && first <= 0xef) {
        if (*offset + 2 >= length || (value[*offset + 1] & 0xc0) != 0x80 ||
            (value[*offset + 2] & 0xc0) != 0x80) return 0;
        if ((first == 0xe0 && value[*offset + 1] < 0xa0) ||
            (first == 0xed && value[*offset + 1] >= 0xa0)) return 0;
        *code_point = ((uint32_t)(first & 0x0f) << 12) |
            ((uint32_t)(value[*offset + 1] & 0x3f) << 6) |
            (uint32_t)(value[*offset + 2] & 0x3f);
        *offset += 3; return 1;
    }
    if (first >= 0xf0 && first <= 0xf4) {
        if (*offset + 3 >= length || (value[*offset + 1] & 0xc0) != 0x80 ||
            (value[*offset + 2] & 0xc0) != 0x80 || (value[*offset + 3] & 0xc0) != 0x80) return 0;
        if ((first == 0xf0 && value[*offset + 1] < 0x90) ||
            (first == 0xf4 && value[*offset + 1] > 0x8f)) return 0;
        *code_point = ((uint32_t)(first & 0x07) << 18) |
            ((uint32_t)(value[*offset + 1] & 0x3f) << 12) |
            ((uint32_t)(value[*offset + 2] & 0x3f) << 6) |
            (uint32_t)(value[*offset + 3] & 0x3f);
        *offset += 4; return 1;
    }
    return 0;
}

static int unsafe_unicode_code_point(uint32_t code_point) {
    if (code_point < 0x20 || (code_point >= 0x7f && code_point <= 0x9f) ||
        code_point == 0xad || code_point == 0x61c || code_point == 0x180e ||
        (code_point >= 0x200b && code_point <= 0x200f) ||
        (code_point >= 0x2028 && code_point <= 0x202e) ||
        (code_point >= 0x2060 && code_point <= 0x206f) ||
        code_point == 0xfeff || code_point == 0xfffd ||
        code_point == 0x20e3 || code_point == 0xfe0f ||
        (code_point >= 0x2600 && code_point <= 0x27bf) ||
        (code_point >= 0x1f000 && code_point <= 0x1faff) ||
        (code_point >= 0xfff9 && code_point <= 0xfffb) ||
        (code_point >= 0xfdd0 && code_point <= 0xfdef) ||
        (code_point & 0xffffu) >= 0xfffeu) return 1;
    return code_point == '{' || code_point == '}' || code_point == '\\' ||
        code_point == '[' || code_point == ']';
}

static int safe_caption(const unsigned char *value, size_t length, int multilingual) {
    if (!length || length > (multilingual ? MAX_CAPTION_BYTES : 240u)) return 0;
    if (value[0] == ' ' || value[length - 1] == ' ') return 0;
    if (unsafe_text_syntax(value, length)) return 0;
    size_t offset = 0, code_points = 0;
    while (offset < length) {
        uint32_t code_point = 0;
        if (!decode_utf8_code_point(value, length, &offset, &code_point) ||
            unsafe_unicode_code_point(code_point) || (!multilingual && code_point > 0x7e)) return 0;
        code_points++;
    }
    return code_points > 0 && code_points <= (multilingual ? 256u : 120u);
}

static unsigned char blend_channel(unsigned char destination, unsigned char source,
                                   unsigned int destination_alpha, unsigned int source_alpha,
                                   unsigned int output_alpha) {
    if (!output_alpha) return 0;
    unsigned int numerator = source * source_alpha * 255u +
        destination * destination_alpha * (255u - source_alpha);
    return (unsigned char)((numerator + output_alpha * 127u) / (output_alpha * 255u));
}

static int write_png(const unsigned char *rgba, int width, int height) {
    png_structp png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if (!png) return 0;
    png_infop info = png_create_info_struct(png);
    if (!info) { png_destroy_write_struct(&png, NULL); return 0; }
    if (setjmp(png_jmpbuf(png))) { png_destroy_write_struct(&png, &info); return 0; }
    png_init_io(png, stdout);
    png_set_IHDR(png, info, width, height, 8, PNG_COLOR_TYPE_RGBA,
                 PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
    png_write_info(png, info);
    png_bytep *rows = calloc((size_t)height, sizeof(*rows));
    if (!rows) { png_destroy_write_struct(&png, &info); return 0; }
    for (int row = 0; row < height; row++) rows[row] = (png_bytep)(rgba + (size_t)row * width * 4u);
    png_write_image(png, rows);
    png_write_end(png, info);
    free(rows);
    png_destroy_write_struct(&png, &info);
    return 1;
}

int main(int argc, char **argv) {
    if (argc != 8) return 2;
    int width, height, timestamp_ms, font_size, margin_v, alignment;
    if (!parse_int(argv[1], 320, 3840, &width) || !parse_int(argv[2], 180, 3840, &height) ||
        !parse_int(argv[3], 0, 1999, &timestamp_ms) || !parse_int(argv[4], 18, 160, &font_size) ||
        !parse_int(argv[5], 20, 360, &margin_v) || !parse_int(argv[6], 1, 9, &alignment)) return 2;
    if ((long long)width * height > 8294400) return 2;

    int multilingual = 0;
    const char *font_name = NULL;
    const char *font_path = NULL;
    ASS_DefaultFontProvider font_provider = ASS_FONTPROVIDER_NONE;
    if (!strcmp(argv[7], "reeditpro_reviewed_fonts_v1")) {
        font_name = "DejaVu Sans";
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
    } else if (!strcmp(argv[7], "reeditpro_reviewed_fonts_v2")) {
        multilingual = 1;
        font_name = "Noto Sans";
        font_path = "/usr/share/fonts/reeditpro/NotoSans-Regular.ttf";
        font_provider = ASS_FONTPROVIDER_FONTCONFIG;
        if (mkdir("/tmp/reeditpro-fontconfig-cache", 0700) && errno != EEXIST) return 3;
    } else return 2;

    unsigned char caption[MAX_CAPTION_BYTES + 2];
    size_t caption_length = fread(caption, 1, sizeof(caption), stdin);
    if (ferror(stdin) || caption_length > MAX_CAPTION_BYTES) return 2;
    if (caption_length && caption[caption_length - 1] == '\n') caption_length--;
    if (!safe_caption(caption, caption_length, multilingual)) return 2;
    caption[caption_length] = 0;

    char script[MAX_SCRIPT_BYTES];
    int script_length = snprintf(script, sizeof(script),
        "[Script Info]\nScriptType: v4.00+\nPlayResX: %d\nPlayResY: %d\nWrapStyle: 2\nScaledBorderAndShadow: yes\n"
        "[V4+ Styles]\n"
        "Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\n"
        "Style: Default,%s,%d,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,%d,40,40,%d,1\n"
        "[Events]\n"
        "Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n"
        "Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,%s\n",
        width, height, font_name, font_size, alignment, margin_v, caption);
    if (script_length <= 0 || script_length >= (int)sizeof(script)) return 2;

    ASS_Library *library = ass_library_init();
    if (!library) return 3;
    ass_set_message_cb(library, discard_libass_message, NULL);
    if (multilingual) ass_set_fonts_dir(library, "/usr/share/fonts/reeditpro");
    ASS_Renderer *renderer = ass_renderer_init(library);
    if (!renderer) { ass_library_done(library); return 3; }
    ass_set_frame_size(renderer, width, height);
    ass_set_storage_size(renderer, width, height);
    ass_set_fonts(renderer, font_path, font_name, font_provider, NULL, 0);
    ASS_Track *track = ass_read_memory(library, script, (size_t)script_length, "UTF-8");
    if (!track) { ass_renderer_done(renderer); ass_library_done(library); return 3; }
    int changed = 0;
    ASS_Image *images = ass_render_frame(renderer, track, timestamp_ms, &changed);
    if (!images) { ass_free_track(track); ass_renderer_done(renderer); ass_library_done(library); return 4; }

    unsigned char *rgba = calloc((size_t)width * height * 4u, 1);
    if (!rgba) { ass_free_track(track); ass_renderer_done(renderer); ass_library_done(library); return 3; }
    unsigned long painted_pixels = 0;
    for (ASS_Image *image = images; image; image = image->next) {
        unsigned char red = (unsigned char)(image->color >> 24);
        unsigned char green = (unsigned char)(image->color >> 16);
        unsigned char blue = (unsigned char)(image->color >> 8);
        unsigned int color_alpha = 255u - (image->color & 0xffu);
        for (int y = 0; y < image->h; y++) for (int x = 0; x < image->w; x++) {
            int target_x = image->dst_x + x, target_y = image->dst_y + y;
            if (target_x < 0 || target_x >= width || target_y < 0 || target_y >= height) continue;
            unsigned int coverage = image->bitmap[(size_t)y * image->stride + x];
            unsigned int source_alpha = (coverage * color_alpha + 127u) / 255u;
            if (!source_alpha) continue;
            unsigned char *pixel = rgba + ((size_t)target_y * width + target_x) * 4u;
            unsigned int destination_alpha = pixel[3];
            unsigned int output_alpha = source_alpha + (destination_alpha * (255u - source_alpha) + 127u) / 255u;
            pixel[0] = blend_channel(pixel[0], red, destination_alpha, source_alpha, output_alpha);
            pixel[1] = blend_channel(pixel[1], green, destination_alpha, source_alpha, output_alpha);
            pixel[2] = blend_channel(pixel[2], blue, destination_alpha, source_alpha, output_alpha);
            pixel[3] = (unsigned char)output_alpha;
            painted_pixels++;
        }
    }
    int success = painted_pixels > 0 && write_png(rgba, width, height);
    free(rgba);
    ass_free_track(track);
    ass_renderer_done(renderer);
    ass_library_done(library);
    return success ? 0 : 4;
}
