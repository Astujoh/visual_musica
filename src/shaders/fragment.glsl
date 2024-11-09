uniform float uTime;

varying vec3 vNormal;
varying vec2 vUv;
varying float vAudioIntensity;

void main() {
  vec3 baseColor = vec3(0.0, 1.0, 0.8);
  float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
  
  vec3 color = mix(baseColor, vec3(1.0), vAudioIntensity);
  float alpha = 0.8 + vAudioIntensity * 0.2;
  
  gl_FragColor = vec4(color, alpha);
}