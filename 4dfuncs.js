//// Requires: mathjs

function project23d(points4d, camDist = -3){
    /** Perspecive project a set of 4D points to 3D */
    let points3d = [Array.from(points4d[0]),Array.from(points4d[1]),Array.from(points4d[2])];
    for ( let x in points3d[0] ){
      let multiplier = 2/(points4d[3][x] - camDist)
      points3d[0][x] *= multiplier;
      points3d[1][x] *= multiplier;
      points3d[2][x] *= multiplier;
    }
  
    return points3d;
  };
  
  
  var Rotor4D = {
    a: [1,0,0,0],
    b: [0,1,0,0],
    theta: 0,
  
    set plane(abArray) {
      // Ensure a and b are unit vectors
      this.a = math.divide(abArray[0], math.norm(abArray[0]));
      this.b = math.divide(abArray[1], math.norm(abArray[1]));
    },
  
    set angle(theta) {
      this.theta = theta;
    },
  
    recalcRotor: function(){
      let a = this.a;
      let b = this.b;
      let plane = [a[0]*b[1]-a[1]*b[0], a[0]*b[2]-a[2]*b[0], a[0]*b[3]-a[3]*b[0], a[1]*b[2]-a[2]*b[1], a[1]*b[3]-a[3]*b[1], a[2]*b[3]-a[3]*b[2]];
      
      let ctheta = math.cos(this.theta/2);
      let stheta = math.sin(this.theta/2);
  
      let c = [ctheta, ...(math.multiply(stheta, plane))];
  
      let c11 = c[0]*c[0];
      let c22 = c[1]*c[1];
      let c33 = c[2]*c[2];
      let c44 = c[3]*c[3];
      let c55 = c[4]*c[4];
      let c66 = c[5]*c[5];
      let c77 = c[6]*c[6];
  
      let c12 = c[0]*c[1];
      let c13 = c[0]*c[2];
      let c14 = c[0]*c[3];
      let c15 = c[0]*c[4];
      let c16 = c[0]*c[5];
      let c17 = c[0]*c[6];
  
      let c23 = c[1]*c[2];
      let c24 = c[1]*c[3];
      let c25 = c[1]*c[4];
      let c26 = c[1]*c[5];
      let c27 = c[1]*c[6];
  
      let c34 = c[2]*c[3];
      let c35 = c[2]*c[4];
      let c36 = c[2]*c[5];
      let c37 = c[2]*c[6];
  
      let c45 = c[3]*c[4];
      let c46 = c[3]*c[5];
      let c47 = c[3]*c[6];
  
      let c56 = c[4]*c[5];
      let c57 = c[4]*c[6];
  
      let c67 = c[5]*c[6];
  
      this.rotationMatrix = [[(c11-c22-c33-c44+c55+c66+c77), -2*(c12+c46+c35), 2*(-c13-c47+c25), 2*(-c14+c26+c37)],
                             [2*(c12-c35-c46), (-c22+c11+c33+c44-c55-c66+c77), -2*(c23+c15+c67), -2*(c24+c16-c57)],
                             [2*(c13+c25-c47), -2*(c23-c15+c67), (-c33+c11+c22+c44-c55+c66-c77), -2*(c34+c56+c17)],
                             [2*(c14+c26+c37), -2*(c24-c16-c57), -2*(c34+c56-c17), (-c44+c11+c22+c33-c66+c55-c77)]];
    },
  
    rotate: function(points){
      return math.multiply(this.rotationMatrix, points);
    }
  }
  
  export { project23d, Rotor4D };