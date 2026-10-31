# Image minuscule pour la tâche planifiée : un appel authentifié à /api/cron.
FROM curlimages/curl:8.11.1
CMD ["sh", "-c", "curl -fsS --max-time 120 -H \"Authorization: Bearer $CRON_SECRET\" \"$APP_URL/api/cron\""]
