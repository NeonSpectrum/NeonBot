var {
  spawn,
  exec
} = require('child_process');

var env = {}

function loop() {
  var child = spawn('node', ['bot'], {
    env: env
  });

  child.stdout.on('data', function(data) {
    process.stdout.write(data.toString());
  });

  child.stderr.on('data', function(data) {
    process.stdout.write(data.toString());
  });

  child.on('close', function(code) {
    if (code == 1641) {
      env.message = "updated"
    } else if (code == 1) {
      env.message = "crashed"
    } else {
      env = {}
    }
    loop()
  });
}
loop()