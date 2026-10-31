# Image minuscule pour la tâche planifiée : un appel authentifié à /api/cron.
FROM curlimages/curl:8.11.1
# -L suit la redirection http → https si APP_URL a été saisi sans protocole.
CMD ["sh", "-c", "curl -fsSL --proto-default https --max-time 120 -H \"Authorization: Bearer $CRON_SECRET\" \"$APP_URL/api/cron\""]
