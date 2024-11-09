uniform float uTime;
uniform float uAudioFrequency[128];

varying vec3 vNormal;
varying vec2 vUv;
varying float vAudioIntensity;

float getAudioIntensity() {
  float intensity = 0.0;
  for(int i = 0; i < 128; i++) {
    intensity += uAudioFrequency[i];
  }
  return intensity / 128.0;
}

void main() {
  vNormal = normal;
  vUv = uv;
  
  float audioIntensity = getAudioIntensity();
  vAudioIntensity = audioIntensity;
  
  vec3 newPosition = position + normal * (audioIntensity * 0.5);
  vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  
  gl_Position = projectedPosition;
}