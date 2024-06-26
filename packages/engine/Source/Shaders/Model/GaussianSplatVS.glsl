void calcCov3D(vec3 scale, vec4 rot, float mod, out float[6] cov3D)
{
    mat3 S = mat3(
        mod * scale[0], 0, 0,
        0, mod * scale[1], 0,
        0, 0, mod * scale[2]
    );

    float x = rot.x;
    float y = rot.y;
    float z = rot.z;
    float w = rot.w;
    mat3 R = mat3(
        1.-2.*(y*y + z*z),   2.*(x*y - w*z),   2.*(x*z + w*y),
        2.*(x*y + w*z), 1.-2.*(x*x + z*z),   2.*(y*z - w*x),
        2.*(x*z - w*y),   2.*(y*z + w*x), 1.-2.*(x*x + y*y)
    );

    mat3 M = S * R;
    mat3 Sigma = transpose(M) * M;

    //we only need part of it, symmetric
    cov3D = float[6](
        Sigma[0][0], Sigma[0][1], Sigma[0][2],
        Sigma[1][1], Sigma[1][2], Sigma[2][2]
    );

}

vec3 calcCov2D(vec3 posEC, float focal_x, float focal_y, float tan_fovx, float tan_fovy, float[6] cov3D, mat4 viewmatrix) {
    vec4 t = viewmatrix * vec4(posEC, 1.0);

    float limx = 1.3 * tan_fovx;
    float limy = 1.3 * tan_fovy;
    float txtz = t.x / t.z;
    float tytz = t.y / t.z;
    t.x = min(limx, max(-limx, txtz)) * t.z;
    t.y = min(limy, max(-limy, tytz)) * t.z;

    mat3 J = mat3(
        focal_x / t.z, 0, -(focal_x * t.x) / (t.z * t.z),
        0, focal_y / t.z, -(focal_y * t.y) / (t.z * t.z),
        0, 0, 0
    );

    mat3 W =  mat3(
        viewmatrix[0][0], viewmatrix[1][0], viewmatrix[2][0],
        viewmatrix[0][1], viewmatrix[1][1], viewmatrix[2][1],
        viewmatrix[0][2], viewmatrix[1][2], viewmatrix[2][2]
    );
   // mat3 W = transpose(mat3(viewmatrix));

    mat3 T = W * J;

    mat3 Vrk = mat3(
        cov3D[0], cov3D[1], cov3D[2],
        cov3D[1], cov3D[3], cov3D[4],
        cov3D[2], cov3D[4], cov3D[5]
    );

    mat3 cov = transpose(T) * transpose(Vrk) * T;

    cov[0][0] += .3;
    cov[1][1] += .3;
    return vec3(cov[0][0], cov[0][1], cov[1][1]);
}

float ndc2Pix(float v, float S) {
    return ((v + 1.) * S - 1.) * .5;
}

void gaussianSplatStage(ProcessedAttributes attributes, inout vec4 positionClip) {
    //convert gaussian scale and rot to covariance matrix
    float[6] cov3D;
    calcCov3D(attributes.scale, attributes.rotation, 1.0, cov3D);

    float aspect = czm_viewport.z / czm_viewport.w;
    float fovx = 2.0 * atan(aspect / czm_projection[0][0]);//1./czm_projection[0][0];
    float fovy = 2.0 * atan(1.0 / czm_projection[1][1]);//1./czm_projection[1][1] * aspect;
    float tan_fovx = tan(fovx / 2.0);
    float tan_fovy = tan(fovy / 2.0);
    float focal_y = czm_viewport.w / (2.0 * tan_fovy);
    float focal_x = czm_viewport.z / (2.0 * tan_fovx);

     mat4 viewMatrix = czm_modelView;
     vec3 cov2d = calcCov2D(attributes.positionMC, focal_x, focal_y, tan_fovx, tan_fovy, cov3D, viewMatrix);

    // vec4 pos2d = czm_modelViewProjection * vec4(v_positionMC,1.0);

    // float clip = 1.2 * pos2d.w;
    // if (pos2d.z < -clip || pos2d.x < -clip || pos2d.x > clip || pos2d.y < -clip || pos2d.y > clip) {
    //     positionClip = vec4(0.0, 0.0, 2.0, 1.0);
    //     return;
    // }

    // float mid = (cov2d.x + cov2d.z) / 2.0;
    // float radius = length(vec2((cov2d.x - cov2d.z) / 2.0, cov2d.y));
    // float lambda1 = mid + radius, lambda2 = mid - radius;

    // if(lambda2 < 0.0) return;
    // vec2 diagonalVector = normalize(vec2(cov2d.y, lambda1 - cov2d.x));
    // vec2 majorAxis = min(sqrt(2.0 * lambda1), 1024.0) * diagonalVector;
    // vec2 minorAxis = min(sqrt(2.0 * lambda2), 1024.0) * vec2(diagonalVector.y, -diagonalVector.x);

    //  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) - 1.;
    //  corner *= 2.;

    // vec3 vCenter = pos2d.xyz / pos2d.w;

    // // vColorMod = clamp(pos2d.z/pos2d.w+1.0, 0.0, 1.0);

    // positionClip = vec4(
    //     vCenter.xy
    //     + corner.x * majorAxis / czm_viewport.z
    //     + corner.y * minorAxis / czm_viewport.w, 0.0, 1.0);

    // v_splatPosition = corner;

    ////////////////////////////////////////////////////////////////////////

    float W = czm_viewport.z;
    float H = czm_viewport.w;

    vec4 p_hom = czm_modelViewProjection * vec4(a_positionMC, 1);
    float p_w = 1. / (p_hom.w + 1e-7);
    vec3 p_proj = p_hom.xyz * p_w;

    // Perform near culling, quit if outside.
    vec4 p_view = viewMatrix * vec4(a_positionMC, 1);
    // if (p_view.z <= .4) {
    //     positionClip = vec4(0, 0, 0, 1);
    //     return;
    // }

        // Invert covariance (EWA algorithm)
   // float det = (cov2d.x * cov2d.z - cov2d.y * cov2d.y);
    // if (det == 0.) {
    //     positionClip = vec4(0, 0, 0, 1);
    //     return;
    // }
   // float det_inv = 1. / det;
   // vec3 conic = vec3(cov2d.z, -cov2d.y, cov2d.x) * det_inv;

    // Compute extent in screen space (by finding eigenvalues of
    // 2D covariance matrix). Use extent to compute the bounding
    // rectangle of the splat in screen space.

    // float mid = 0.5 * (cov2d.x + cov2d.z);
    // float lambda1 = mid + sqrt(max(0.1, mid * mid - det));
    // float lambda2 = mid - sqrt(max(0.1, mid * mid - det));
    // float my_radius = ceil(3. * sqrt(max(lambda1, lambda2)));
     vec2 point_image = vec2(ndc2Pix(p_proj.x, W), ndc2Pix(p_proj.y, H));

// Calculate eigenvalues and eigenvectors
float a = cov2d.x;
float b = cov2d.y;
float c = cov2d.z;
float trace = a + c;
float det = max(0.0, a * c - b * b);  // Ensure non-negative
float gap = sqrt(max(0.0, trace * trace / 4.0 - det));
v_lambda1 = max(1e-5, (trace / 2.0) + gap);
v_lambda2 = max(1e-5, (trace / 2.0) - gap);

// Ensure lambda1 is the larger eigenvalue
if (v_lambda2 > v_lambda1) {
    float temp = v_lambda1;
    v_lambda1 = v_lambda2;
    v_lambda2 = temp;
}

v_eigen1 = normalize(vec2(b, v_lambda1 - a));
v_eigen2 = vec2(-v_eigen1.y, v_eigen1.x);

    // Calculate splat radius
    float radius = ceil(3.0 * sqrt(max(v_lambda1, v_lambda2)));

    // (Webgl-specific) Convert gl_VertexID from [0,1,2,3] to [-1,-1],[1,-1],[-1,1],[1,1]
    //vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) - 1.;
    // Vertex position in screen space
    //vec2 screen_pos = point_image + my_radius * corner;

    // Calculate splat bounds in screen space
    vec4 bounds = vec4(
        point_image.x - radius,
        point_image.y - radius,
        point_image.x + radius,
        point_image.y + radius
    );

    // Pass data to fragment shader
    v_splatBounds = bounds;
    // Store some useful helper data for the fragment stage
   // v_conic = conic;
    v_splatCenter = p_proj.xy;
   // v_splatVertexPos = screen_pos;

    // (Webgl-specific) Convert from screen-space to clip-space
    vec2 clip_pos = point_image / vec2(W, H) * 2. - 1.;

    positionClip = vec4(p_proj, 1.0);//vec4(clip_pos, 0, 1);

    float distanceScale = 1.0 / max(1.0, -p_view.z);

    // Set point size, scaled by distance and viewport height
    gl_PointSize = 40.;
}
