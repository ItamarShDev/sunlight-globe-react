uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform float sunAngle;
uniform float sunLatitude;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    // Calculate sun direction in world space
    float lat = radians(sunLatitude);
    vec3 sunDirection = normalize(vec3(
        cos(lat) * cos(sunAngle),
        sin(lat),
        cos(lat) * sin(sunAngle)
    ));
    
    // Calculate light intensity
    float intensity = dot(vNormal, sunDirection);
    
    // Smoother transition between day and night
    // Use wider transition zone and cubic smoothstep for more natural look
    float dayness = smoothstep(-0.2, 0.2, intensity);
    
    // Sample textures
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    
    // Mix colors with smooth transition
    gl_FragColor = mix(nightColor, dayColor, dayness);
}
