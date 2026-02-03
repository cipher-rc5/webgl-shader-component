"use client"
import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"
import { forwardRef, useMemo } from "react"
import { ShaderCanvas } from "./shader-canvas"

// Fragment Shader Code
const FRAGMENT_SHADER_CODE = `
#define FAR 80.

mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float hash( vec3 p ){ return fract(sin(dot(p, vec3(21.71, 157.97, 113.43)))*45758.5453); }

#define RIGID
vec2 hash22(vec2 p) {
    float n = sin(dot(p, vec2(113, 1)));
    p = fract(vec2(2097152, 262144)*n)*2. - 1.;
    #ifdef RIGID
    return p;
    #else
    return cos(p*6.283 + iTime);
    #endif
}

float gradN2D(in vec2 f){
   const vec2 e = vec2(0, 1);
    vec2 p = floor(f);
    f -= p;
    vec2 w = f*f*(3. - 2.*f);
    float c = mix(mix(dot(hash22(p + e.xx), f - e.xx), dot(hash22(p + e.yx), f - e.yx), w.x),
                  mix(dot(hash22(p + e.xy), f - e.xy), dot(hash22(p + e.yy), f - e.yy), w.x), w.y);
    return c*.5 + .5;
}

float fBm(in vec2 p){
    return gradN2D(p)*.57 + gradN2D(p*2.)*.28 + gradN2D(p*4.)*.15;
}

float n2D(vec2 p) {
    vec2 i = floor(p); p -= i;
    p *= p*(3. - p*2.);
    return dot(mat2(fract(sin(mod(vec4(0, 1, 113, 114) + dot(i, vec2(1, 113)), 6.2831853))*
               43758.5453))*vec2(1. - p.y, p.y), vec2(1. - p.x, p.x) );
}

float grad(float x, float offs){
    x = abs(fract(x/6.283 + offs - .25) - .5)*2.;
    float x2 = clamp(x*x*(-1. + 2.*x), 0., 1.);
    x = smoothstep(0., 1., x);
    return mix(x, x2, .15);
}

float sandL(vec2 p){
    vec2 q = rot2(3.14159/18.)*p;
    q.y += (gradN2D(q*18.) - .5)*.05;
    float grad1 = grad(q.y*80., 0.);

    q = rot2(-3.14159/20.)*p;
    q.y += (gradN2D(q*12.) - .5)*.05;
    float grad2 = grad(q.y*80., .5);

    q = rot2(3.14159/4.)*p;
    float a2 = dot(sin(q*12. - cos(q.yx*12.)), vec2(.25)) + .5;
    float a1 = 1. - a2;

    float c = 1. - (1. - grad1*a1)*(1. - grad2*a2);

    return c;
}

float gT;

float sand(vec2 p){
    p = vec2(p.y - p.x, p.x + p.y)*.7071/4.;

    float c1 = sandL(p);

    vec2 q = rot2(3.14159/12.)*p;
    float c2 = sandL(q*1.25);

    c1 = mix(c1, c2, smoothstep(.1, .9, gradN2D(p*vec2(4))));

    return c1/(1. + gT*gT*.015);
}

vec2 path(in float z){
    return vec2(4.*sin(z * .1), 0);
}

float surfFunc( in vec3 p){
    p /= 2.5;

    float layer1 = n2D(p.xz*.2)*2. - .5;
    layer1 = smoothstep(0., 1.05, layer1);

    float layer2 = n2D(p.xz*.275);
    layer2 = 1. - abs(layer2 - .5)*2.;
    layer2 = smoothstep(.2, 1., layer2*layer2);

    float layer3 = n2D(p.xz*.5*3.);

    float res = layer1*.7 + layer2*.25 + layer3*.05;

    return res;
}

float camSurfFunc( in vec3 p){
    p /= 2.5;

    float layer1 = n2D(p.xz*.2)*2. - .5;
    layer1 = smoothstep(0., 1.05, layer1);

    float layer2 = n2D(p.xz*.275);
    layer2 = 1. - abs(layer2 - .5)*2.;
    layer2 = smoothstep(.2, 1., layer2*layer2);

    float res = (layer1*.7 + layer2*.25)/.95;

    return res;
}

float map(vec3 p){
    float sf = surfFunc(p);
    return p.y + (.5-sf)*2.;
}

float trace(in vec3 ro, in vec3 rd){
    float t = 0., h;

    for(int i = 0; i<96; i++){
        h = map(ro + rd*t);
        if(abs(h)<.001*(t*.125 + 1.) || t>FAR) break;
        t += h;
    }

    return min(t, FAR);
}

vec3 normal(in vec3 p, float ef) {
    const vec2 e = vec2(.001, 0);
    return normalize(vec3(map(p + e.xyy*ef) - map(p - e.xyy*ef),
                          map(p + e.yxy*ef) - map(p - e.yxy*ef),
                          map(p + e.yyx*ef) - map(p - e.yyx*ef)));
}

float n3D(in vec3 p){
    const vec3 s = vec3(113, 157, 1);
    vec3 ip = floor(p); p -= ip;
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p*p*(3. - 2.*p);
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
}

float fBm(in vec3 p){
    return n3D(p)*.57 + n3D(p*2.)*.28 + n3D(p*4.)*.15;
}

float bumpSurf3D( in vec3 p){
    float n = surfFunc(p);
    vec3 px = p + vec3(.001, 0, 0);
    float nx = surfFunc(px);
    vec3 pz = p + vec3(0, 0, .001);
    float nz = surfFunc(pz);

    return sand(p.xz + vec2(n - nx, n - nz)/.001*1.);
}

vec3 doBumpMap(in vec3 p, in vec3 nor, float bumpfactor){
    const vec2 e = vec2(0.001, 0);

    float ref = bumpSurf3D(p);
    vec3 grad = (vec3(bumpSurf3D(p - e.xyy),
                      bumpSurf3D(p - e.yxy),
                      bumpSurf3D(p - e.yyx)) - ref)/e.x;

    grad -= nor*dot(nor, grad);

    return normalize(nor + grad*bumpfactor);
}

float softShadow(vec3 ro, vec3 lp, float k, float t){
    const int maxIterationsShad = 24;

    vec3 rd = lp - ro;

    float shade = 1.;
    float dist = 0.0015;
    float end = max(length(rd), .0001);
    rd /= end;

    for (int i = 0; i<maxIterationsShad; i++){
        float h = map(ro + rd*dist);
        shade = min(shade, k*h/dist);
        h = clamp(h, .1, .5);
        dist += h;

        if (shade<.001 || dist > end) break;
    }

    return min(max(shade, 0.) + .05, 1.);
}

float calcAO(in vec3 p, in vec3 n)
{
    float ao = 0.0, l;
    const float maxDist = 4.;
    const float nbIte = 5.;
    for( float i=1.; i< nbIte+.5; i++ ){
        l = (i + .0)*.5/nbIte*maxDist;
        ao += (l - map( p + n*l ));
    }

    return clamp(1.- ao/nbIte, 0., 1.);
}

vec3 getSky(vec3 ro, vec3 rd, vec3 ld){
    vec3 col = vec3(.8, .7, .5), col2 = vec3(.4, .6, .9);

    vec3 sky = mix(col, col2, pow(max(rd.y + .15, 0.), .5));
    sky *= vec3(.84, 1, 1.17);

    float sun = clamp(dot(ld, rd), 0., 1.);
    sky += vec3(1, .7, .4)*vec3(pow(sun, 16.))*.2;
    sun = pow(sun, 32.);
    sky += vec3(1, .9, .6)*vec3(pow(sun, 32.))*.35;

    rd.z *= 1. + length(rd.xy)*.15;
    rd = normalize(rd);

    const float SC = 1e5;
    float t = (SC - ro.y - .15)/(rd.y + .15);
    vec2 uv = (ro + t*rd).xz;

    if(t>0.) sky =  mix(sky, vec3(2), smoothstep(.45, 1., fBm(1.5*uv/SC))*
                        smoothstep(.45, .55, rd.y*.5 + .5)*.4);

    return sky;
}

float noise3D(in vec3 p){
    const vec3 s = vec3(113, 157, 1);
    vec3 ip = floor(p);
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p -= ip;
    p = p*p*(3. - 2.*p);
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
}

float hash31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)))*43758.5453); }

float getMist(in vec3 ro, in vec3 rd, in vec3 lp, in float t){
    float mist = 0.;
    float t0 = 0.;

    for (int i = 0; i<24; i++){
        if (t0>t) break;
        float sDi = length(lp-ro)/FAR;
        float sAtt = 1./(1. + sDi*.25);
        vec3 ro2 = (ro + rd*t0)*2.5;
        float c = noise3D(ro2)*.65 + noise3D(ro2*3.)*.25 + noise3D(ro2*9.)*.1;
        float n = c;
        mist += n*sAtt;
        t0 += clamp(c*.25, .1, 1.);
    }

    return max(mist/48., 0.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 u = (fragCoord - iResolution.xy*.5)/iResolution.y;

    vec3 ro = vec3(0, 1.2, iTime*2.*u_speed);
    vec3 lookAt = ro + vec3(0, -.15, .5);

    ro.xy += path(ro.z);
    lookAt.xy += path(lookAt.z);

    float sfH = camSurfFunc(ro);
    float sfH2 = camSurfFunc(lookAt);
    float slope = (sfH2 - sfH)/length(lookAt - ro);

    ro.y += sfH2;
    lookAt.y += sfH2;

    float FOV = 3.14159265/2.5;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0, -forward.x ));
    vec3 up = cross(forward, right);

    vec3 rd = normalize(forward + FOV*u.x*right + FOV*u.y*up);

    rd.xy = rot2( path(lookAt.z).x/96.)*rd.xy;
    rd.yz = rot2(-slope/3.)*rd.yz;

    vec3 lp = vec3(FAR*.25, FAR*.25, FAR) + vec3(0, 0, ro.z);

    float t = trace(ro, rd);

    gT = t;

    vec3 col = vec3(0);
    vec3 sp = ro+t*rd;
    float pathHeight = sp.y;

    if (t < FAR){
        vec3 sn = normal(sp, 1.);
        vec3 ld = lp - sp;
        float lDist = max(length(ld), 0.001);
        ld /= lDist;
        lDist /= FAR;
        float atten = 1./(1. + lDist*lDist*.025);

        sn = doBumpMap(sp, sn, .07*u_bumpIntensity);

        float sh = softShadow(sp + sn*.002, lp, 6., t);
        float ao = calcAO(sp, sn);
        sh = min(sh + ao*.25, 1.);

        float dif = max( dot( ld, sn ), 0.0);
        float spe = pow(max( dot( reflect(-ld, sn), -rd ), 0.0 ), 5.);
        float fre = clamp(1.0 + dot(rd, sn), 0.0, 1.0);

        float Schlick = pow( 1. - max(dot(rd, normalize(rd + ld)), 0.), 5.0);
        float fre2 = mix(.2, 1., Schlick);

        float amb = ao*.35;

        col = mix(vec3(1, .95, .7), vec3(.9, .6, .4), fBm(sp.xz*16.*u_sandDetail));
        col = mix(col*1.4, col*.6, fBm(sp.xz*32.*u_sandDetail - .5));

        float bSurf = bumpSurf3D(sp);
        col *= bSurf*.75 + .5;

        col = mix(col*.7 + (hash(floor(sp*96.))*.7 + hash(floor(sp*192.))*.3)*.3, col, min(t*t/FAR, 1.));

        col *= vec3(1.2, 1, .9);

        col = col*(dif + amb + vec3(1, .97, .92)*fre2*spe*2.)*atten;

        vec3 refSky = getSky(sp, reflect(rd, sn), ld);
        col += col*refSky*.05 + refSky*fre*fre2*atten*.15;

        col *= sh*ao;
    }

    float dust = getMist(ro, rd, lp, t)*(1. - smoothstep(0., 1., pathHeight*.05));
    vec3 gLD = normalize(lp - vec3(0, 0, ro.z));
    vec3 sky = getSky(ro, rd, gLD);
    col = mix(col, sky, smoothstep(0., .95, t/FAR));

    vec3 mistCol = vec3(1, .95, .9);

    col += vec3(1., .6, .2)*pow( max(dot(rd, gLD), 0.), 16.)*.45;

    col = col*.75 + (col + .25*vec3(1.2, 1, .9))*mistCol*dust*1.5*u_mistIntensity;

    u = fragCoord/iResolution.xy;
    col = min(col, 1.)*pow( 16.*u.x*u.y*(1. - u.x)*(1. - u.y) , .0625);

    fragColor = vec4(sqrt(clamp(col, 0., 1.)), 1);
}
`

export interface DesertSandShaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	readonly speed?: number
	readonly sandDetail?: number
	readonly bumpIntensity?: number
	readonly mistIntensity?: number
}

export const DesertSandShader = forwardRef<
	HTMLDivElement,
	DesertSandShaderProps
>(({
	className,
	speed = 1.0,
	sandDetail = 1.0,
	bumpIntensity = 1.0,
	mistIntensity = 1.0,
	...props
}, ref) => {
	// Memoize uniforms to prevent unnecessary shader updates
	const uniforms = useMemo(
		() => ({
			u_speed: { type: "1f" as const, value: speed },
			u_sandDetail: { type: "1f" as const, value: sandDetail },
			u_bumpIntensity: { type: "1f" as const, value: bumpIntensity },
			u_mistIntensity: { type: "1f" as const, value: mistIntensity },
		}),
		[speed, sandDetail, bumpIntensity, mistIntensity],
	)

	return (
		<div className={cn("h-full w-full", className)} ref={ref} {...props}>
			<ShaderCanvas
				fragmentShader={FRAGMENT_SHADER_CODE}
				style={{ width: "100%", height: "100%" }}
				className="block h-full w-full"
				uniforms={uniforms}
			/>
		</div>
	)
})

DesertSandShader.displayName = "DesertSandShader"
