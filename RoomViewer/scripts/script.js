const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SCALE = canvas.width / 2;

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const RED = "#FF0000";
const ORANGE = "#FF9900";
const YELLOW = "#FFFF00";
const GREEN = "#00FF00";
const CYAN = "#00FFFF";
const BLUE = "#0000FF";
const PURPLE = "#9900FF";
const MAGENTA = "#FF00FF";

const JSON_FILE_NAME = "Object.json";

const X = 0;
const Y = 1;
const Z = 2;
const W = 3;

const TRIVIAL_ACCEPT = 1;
const PARTIAL_ACCEPT = 0;
const TRIVIAL_REJECT = -1;

const PI = math.pi;

var Entity = function(points, lines, color) {
  this.points = points;
  this.lines = lines;
  this.color = color;
}

var VRP, VPN, VUP, COP, DOP, CW, FP, BP;
var ST, PR1, PR2;
var u, v, n, r;
var w_min, w_max;
var z_min, z_max, z_proj;
var objects, projected_objects;

var N, P;
var cam, theta, phi, velocity;

const load = () => {
  COP = [0, 0, 4, 1];
  VRP = [0, 0, 0, 1];
  VPN = [0, 0, 1];
  VUP = [0, 1, 0];

  cam = [0, 0, 0];
  r = getVectorLength([COP[X], COP[Y], COP[Z]]);

  w_max = [2, 2];
  w_min = [-2, -2];

  FP = 5;
  BP = -10;

  theta = 0;
  phi = 0;
  velocity = 0.1;

  ST = [
    [SCALE, 0, 0, 0],
    [0, SCALE, 0, 0],
    [0, 0, 0, 0],
    [WIDTH / 2, HEIGHT / 2, 0, 1]
  ];

  // PR2 = [
  //   [1, 0, 0, 0],
  //   [0, 1, 0, 0],
  //   [0, 0, 0, 0],
  //   [0, 0, 0, 1]
  // ];

  objects = [];
  
  objects.push(createCube([-2, 0, 2], 1.5, ORANGE));
  objects.push(createCube([0, 0, 2], 1.5, BLUE));
  objects.push(createCube([2, 0, 2], 1.5, PURPLE));

  objects.push(createCube([-2, 0, 0], 1.5, YELLOW));
  objects.push(createCube([0, 0, 0], 1.5, BLACK));
  objects.push(createCube([2, 0, 0], 1.5, GREEN));
  
  objects.push(createCube([-2, 0, -2], 1.5, MAGENTA));
  objects.push(createCube([0, 0, -2], 1.5, RED));
  objects.push(createCube([2, 0, -2], 1.5, CYAN));

  render();
}

const render = () => {
  clearScreen();
  updateCounter();

  projected_objects = JSON.parse(JSON.stringify(objects));

  n = getUnitVector(VPN);
  v = getUnitVector(math.add(VUP, math.multiply(-1 * math.dot(VUP, n), n)));
  u = math.cross(v, n);

  CW = [(w_max[X] + w_min[X]) / 2, (w_max[Y] + w_min[Y]) / 2, 0];
  DOP = [CW[X] - COP[X], CW[Y] - COP[Y], CW[Z] - COP[Z]];
  cam = math.add([VRP[X], VRP[Y], VRP[Z]], math.multiply(r, n));

  doT1T2();
  doT3();
  doT4();
  doT5();
  
  N = [
    [0, 0, -1],
    [0, 0, 1],
    [-1, 0, -1],
    [1, 0, -1],
    [0, -1, -1],
    [0, 1, -1]
  ];

  P = [
    [0, 0, z_min],
    [0, 0, -1],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  projected_objects.forEach(object => { getObjectProjection(object); });
  projected_objects.forEach(object => { cyrusBeckClip(object); });
  
  doT7();
  doT8();
  doT9();
  
  projected_objects.forEach(object => { getObjectProjection(object); });
  projected_objects.forEach(object => { drawObject(object); });
}

const doT1T2 = () => {
  var M = [
    [u[X], v[X], n[X], 0],
    [u[Y], v[Y], n[Y], 0],
    [u[Z], v[Z], n[Z], 0],
    [0, 0, 0, 1]
  ];

  var r = math.multiply(VRP, M);

  var T = [
    [u[X], v[X], n[X], 0],
    [u[Y], v[Y], n[Y], 0],
    [u[Z], v[Z], n[Z], 0],
    [0 - r[X], 0 - r[Y], 0 - r[Z], 1]
  ];

  PR1 = [...T];
}

const doT3 = () => {
  var T = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0 - COP[X], 0 - COP[Y], 0 - COP[Z], 1]
  ];

  PR1 = math.multiply(PR1, T);
}

const doT4 = () => {
  var shx = 0 - DOP[X] / DOP[Z];
  var shy = 0 - DOP[Y] / DOP[Z];

  var T = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [shx, shy, 1, 0],
    [0, 0, 0, 1]
  ];

  PR1 = math.multiply(PR1, T);
}

const doT5 = () => {
  var sx = 2 * COP[Z] / ((COP[Z] - BP) * (w_max[X] - w_min[X]));
  var sy = 2 * COP[Z] / ((COP[Z] - BP) * (w_max[Y] - w_min[Y]));
  var sz = -1 / (BP - COP[Z]);

  z_proj = COP[Z] / (BP - COP[Z]);
  z_min = (0 - (FP - COP[Z])) / (BP - COP[Z]);
  z_max = -1;

  var T = [
    [sx, 0, 0, 0],
    [0, sy, 0, 0],
    [0, 0, sz, 0],
    [0, 0, 0, 1],
  ];

  PR1 = math.multiply(PR1, T);
}

const cyrusBeckClip = object => {
  var n = object.lines.length;

  var temp_points = JSON.parse(JSON.stringify(object.points));
  var temp_lines = JSON.parse(JSON.stringify(object.lines));

  object.points = [];
  object.lines = [];

  for(var i = 0; i < n; i++) {
    var p1 = [
      temp_points[temp_lines[i][0]][X],
      temp_points[temp_lines[i][0]][Y],
      temp_points[temp_lines[i][0]][Z]
    ];

    var p2 = [
      temp_points[temp_lines[i][1]][X],
      temp_points[temp_lines[i][1]][Y],
      temp_points[temp_lines[i][1]][Z]
    ];

    var stats = [];
    var m = N.length;

    for(var j = 0; j < m; j++) {
      var d1 = math.dot(math.subtract(p1, P[j]), N[j]);
      var d2 = math.dot(math.subtract(p2, P[j]), N[j]);

      if ((d1 >= 0) && (d2 >= 0)) {
        stats.push(TRIVIAL_ACCEPT);
      } else if ((d1 < 0) && (d2 < 0)) {
        stats.push(TRIVIAL_REJECT);
      } else {
        stats.push(PARTIAL_ACCEPT);
      }
    }

    if(!stats.includes(TRIVIAL_REJECT)) {
      var max_e = 0
      var min_l = 1

      for(var j = 0; j < m; j++) {
        if (stats[j] === PARTIAL_ACCEPT) {
          var d = math.dot(math.subtract(p2, p1), N[j]);
          var t = math.dot(math.subtract(P[j], p1), N[j]) / d;
          if ((d > 0) && (t > max_e)) max_e = t;
          if ((d < 0) && (t < min_l)) min_l = t;
        }
      }
      
      if (max_e < min_l) {
        var temp = math.multiply(min_l, math.subtract(p2, p1));
        p2[X] = p1[X] + temp[0];
        p2[Y] = p1[Y] + temp[1];
        p2[Z] = p1[Z] + temp[2];
        
        temp = math.multiply(max_e, math.subtract(p2, p1));
        p1[X] = p1[X] + temp[0];
        p1[Y] = p1[Y] + temp[1];
        p1[Z] = p1[Z] + temp[2];

        p2.push(1);
        p1.push(1);

        var first = object.points.length;
        if(first === 0) object.points.push(p2);
        for(var j = 0; j < first; j++) {
          if(JSON.stringify(p2) === JSON.stringify(object.points[j])) {
            first = j;
            break;
          }

          if(j == first - 1) object.points.push(p2);
        }
        
        var second = object.points.length;
        if(second === 0) object.points.push(p2);
        for(var j = 0; j < second; j++) {
          if(JSON.stringify(p1) === JSON.stringify(object.points[j])) {
            second = j;
            break;
          }

          if(j == second - 1) object.points.push(p1);
        }

        object.lines.push([first, second]);
      }
    }
  }
}

const doT7 = () => {
  var n = COP[Z] / (BP - COP[Z]);

  var T = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0 - n, 1]
  ];

  PR1 = [...T];
}

const doT8 = () => {
  var n = COP[Z] / (COP[Z] - BP);

  var T = [
    [1 / n, 0 , 0, 0],
    [0, 1 / n , 0, 0],
    [0, 0 , 1, 0],
    [0, 0 , 0, 1]
  ];

  PR1 = math.multiply(PR1, T);
}

const doT9 = () => {
  var n = (COP[Z] - BP) / COP[Z];

  var T = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0 - n],
    [0, 0, 0, 1]
  ];

  PR1 = math.multiply(PR1, T);
}

const moveCameraHorizontal = (v, dir) => {
  cam[X] = VRP[X] + r * n[X];
  cam[Z] = VRP[Z] + r * n[Z];

  cam[Z] -= v * cos(theta + dir);
  cam[X] -= v * sin(theta + dir);

  VRP[X] = cam[X] - r * n[X];
  VRP[Z] = cam[Z] - r * n[Z];
}

const moveCameraVertical = (v, dir) => {
  cam[Y] = VRP[Y] + r * n[Y];
  cam[Y] -= v * sin(phi + dir);

  VRP[Y] = cam[Y] - r * n[Y];
}

const rotateCamera = () => {
  n = getUnitVector(VPN);

  VRP[X] = cam[X] - r * n[X];
  VRP[Y] = cam[Y] - r * n[Y];
  VRP[Z] = cam[Z] - r * n[Z];
}

const rotateCameraHorizontal = dir => {
  theta += dir;

  VPN[X] = sin(theta);
  VPN[Z] = cos(theta);

  rotateCamera();
}

const rotateCameraVertical = dir => {
  var temp = phi + dir;
  if(temp >= -90 && temp <= 90) phi = temp;

  VPN[Y] = sin(phi);

  rotateCamera();
}

const getObjectProjection = object => {
  var len = object.points.length;

  for(var i = 0; i < len; i++) {
    object.points[i] = math.multiply(object.points[i], PR1);
  }

  return object;
}

const drawObject = object => {
  var p1, p2;
  var n = object.lines.length;

  if(n !== 0) object.points = math.multiply(object.points, ST);
  // object.points = math.multiply(object.points, PR2);

  for(var i = 0; i < n; i++) {
    p1 = object.points[object.lines[i][0]];
    p2 = object.points[object.lines[i][1]];

    p2[X] /= p2[W];
    p2[Y] /= p2[W];
    p2[Z] /= p2[W];
    p2[W] = 1;

    p1[X] /= p1[W];
    p1[Y] /= p1[W];
    p1[Z] /= p1[W];
    p1[W] = 1;

    ctx.beginPath();
    ctx.moveTo(p1[X], p1[Y]);
    ctx.lineTo(p2[X], p2[Y]);
    ctx.strokeStyle = object.color;

    ctx.stroke();
  }
}

const createCube = (center, length, color) => {
  const d = length / 2;

  var points = [];
  var lines = [];

  points.push([center[X] - d, center[Y] + d, center[Z] + d, 1]);
  points.push([center[X] + d, center[Y] + d, center[Z] + d, 1]);
  points.push([center[X] + d, center[Y] - d, center[Z] + d, 1]);
  points.push([center[X] - d, center[Y] - d, center[Z] + d, 1]);

  points.push([center[X] - d, center[Y] + d, center[Z] - d, 1]);
  points.push([center[X] + d, center[Y] + d, center[Z] - d, 1]);
  points.push([center[X] + d, center[Y] - d, center[Z] - d, 1]);
  points.push([center[X] - d, center[Y] - d, center[Z] - d, 1]);

  lines.push([0, 1]);
  lines.push([1, 2]);
  lines.push([2, 3]);
  lines.push([3, 0]);

  lines.push([4, 5]);
  lines.push([5, 6]);
  lines.push([6, 7]);
  lines.push([7, 4]);

  lines.push([0, 4]);
  lines.push([1, 5]);
  lines.push([2, 6]);
  lines.push([3, 7]);
  
  return new Entity(points, lines, color);
}

const sin = deg => math.sin(deg * PI / 180);
const cos = deg => math.cos(deg * PI / 180);

const getVectorLength = vector => math.sqrt(
  vector[X] * vector[X] + vector[Y] * vector[Y] + vector[Z] * vector[Z]
);

const getUnitVector = vector => {
  var len = getVectorLength(vector);
  return [vector[X] / len, vector[Y] / len, vector[Z] / len];
}

const clearScreen = () => ctx.clearRect(0, 0, WIDTH, HEIGHT);

const updateCounter = () => {
  document.getElementById('fp').value = "FP: " + FP;
  document.getElementById('bp').value = "BP: " + BP;
  document.getElementById('velocity').value = "Velocity: " + velocity.toFixed(2);
}

document.addEventListener('keydown', onkeydown, false);

var onkeydown = e => {
  if(e.key === 'w') {
    moveCameraHorizontal(velocity, 0);
  } else if(e.key === 's') {
    moveCameraHorizontal(0 - velocity, 0);
  } else if(e.key === 'a') {
    moveCameraHorizontal(velocity, 90);
  } else if(e.key === 'd') {
    moveCameraHorizontal(0 - velocity, 90);
  } else if(e.key === ' ') {
    moveCameraVertical(velocity, 90);
  } else if(e.key === 'Shift') {
    moveCameraVertical(0 - velocity, 90);
  } else if(e.key === 'n') {
    FP -= 1;
  } else if(e.key === 'm') {
    FP += 1;
  } else if(e.key === ',') {
    BP -= 1;
  } else if(e.key === '.') {
    BP += 1;
  } else if(e.key === 'i') {
    rotateCameraVertical(velocity);
  } else if(e.key === 'k') {
    rotateCameraVertical(0 - velocity);
  } else if(e.key === 'j') {
    rotateCameraHorizontal(velocity);
  } else if(e.key === 'l') {
    rotateCameraHorizontal(0 - velocity);
  } else if(e.key === '1') {
    if(velocity - 0.02 >= 0) velocity -= 0.01;
  } else if(e.key === '2') {
    velocity += 0.01;
  } else if(e.key === 'h') {
    Swal.fire({
      icon: 'info',
      title: 'Control',
      html: '<table id="control"><tbody>' +
        '<tr><td id="left">W</td><td id="right">Move forward</td>' +
        '<td id="left">I</td><td id="right">Turn upward</td></tr>' +
        '<tr><td id="left">S</td><td id="right">Move forward</td>' +
        '<td id="left">K</td><td id="right">Turn downward</td></tr>' +
        '<tr><td id="left">A</td><td id="right">Move to left</td>' +
        '<td id="left">J</td><td id="right">Turn to left</td></tr>' +
        '<tr><td id="left">D</td><td id="right">Move to right</td>' +
        '<td id="left">L</td><td id="right">Turn to right</td></tr>' +
        '<tr><td id="left">Space</td><td id="right">Ascend</td>' +
        '<td id="left">1</td><td id="right">Increase velocity</td></tr>' +
        '<tr><td id="left">Shift</td><td id="right">Descend</td>' +
        '<td id="left">2</td><td id="right">Decrease velocity</td></tr>' +
        '<tr><td id="left">N</td><td id="right">Increase FP</td>' +
        '<td id="left">,</td><td id="right">Increase BP</td></tr>' +
        '<tr><td id="left">M</td><td id="right">Decrease FP</td>' +
        '<td id="left">.</td><td id="right">Decrease BP</td></tr>' +
        '<tr><td id="left">O</td><td id="right">Load file</td>' +
        '<td id="left">H</td><td id="right">Show control</td></tr>' +
      '</tbody></table>',
      width: '40rem'
    });
  } else if(e.key === 'o') {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire('Success!', 'Your file has been loaded.', 'success');
        $.getJSON(JSON_FILE_NAME, function(new_objects) {
          objects = [...new_objects];
          render();
        });
      }
    });
  } else return;

  render();
}

var changeTheme = () => {
  if(document.getElementById('btn_theme').innerHTML === "Dark") {
    document.body.style.backgroundColor = BLACK;
    document.body.style.color = WHITE;

    document.getElementById('fp').style.backgroundColor = BLACK;
    document.getElementById('fp').style.color = WHITE;
    document.getElementById('bp').style.backgroundColor = BLACK;
    document.getElementById('bp').style.color = WHITE;
    document.getElementById('velocity').style.backgroundColor = BLACK;
    document.getElementById('velocity').style.color = WHITE;

    document.getElementById('btn_theme').innerHTML = "Light";
    document.getElementById('btn_theme').style.backgroundColor = BLACK;
    document.getElementById('btn_theme').style.color = WHITE;
    objects.forEach(object => { if(object.color === BLACK) object.color = WHITE; });
  } else {
    document.body.style.backgroundColor = WHITE;
    document.body.style.color = BLACK;

    document.getElementById('fp').style.backgroundColor = WHITE;
    document.getElementById('fp').style.color = BLACK;
    document.getElementById('bp').style.backgroundColor = WHITE;
    document.getElementById('bp').style.color = BLACK;
    document.getElementById('velocity').style.backgroundColor = WHITE;
    document.getElementById('velocity').style.color = BLACK;

    document.getElementById('btn_theme').innerHTML = "Dark";
    document.getElementById('btn_theme').style.backgroundColor = WHITE;
    document.getElementById('btn_theme').style.color = BLACK;
    objects.forEach(object => { if(object.color === WHITE) object.color = BLACK; });
  }

  render();
}