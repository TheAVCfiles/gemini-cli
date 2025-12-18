{{- define "avc-relay.name" -}}
avc-relay
{{- end -}}

{{- define "avc-relay.fullname" -}}
{{ include "avc-relay.name" . }}
{{- end -}}
