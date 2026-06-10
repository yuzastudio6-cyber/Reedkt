# Supabase Support Ticket Next Response Handling

Current decision: `support_ticket_ready_for_manual_operator_submission`

After the operator submits the manual packet, record the ticket reference and wait for the Supabase support response. Do not reset, deploy, repair migration history, backfill Track B rows, or touch production until a support-response recovery decision packet reviews the response.
