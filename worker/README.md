# Fanime media worker

This Worker is a restricted proxy for media URLs from sources you are authorized to access. It is not a general-purpose URL proxy. Configure a provider allowlist before use.

Set `PROVIDERS_JSON` as a Worker secret or variable, for example:
`{"catalogA":{"referer":"https://player.example/","origin":"https://player.example","allowedHosts":["media.example","cdn.example"]}}`

Requests use `/proxy/<provider-id>?url=<encoded-https-url>`. Every destination and redirect host must be allowlisted. Do not add hosts or sources without authorization.
