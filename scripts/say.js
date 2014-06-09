// Description:
//   Say things
//
// Dependencies:
//   festival text-to-speech engine
//
// Author:
//   kimmobrunfeldt


var sys = require('sys');
var exec = require('child_process').exec;
var _ = require('lodash');

function puts(error, stdout, stderr) { sys.puts(stdout); }


// https://gist.github.com/creationix/2502704
// Implement bash string escaping.
var safePattern =    /^[a-z0-9_\/\-.,?:@#%^+=\[\]]*$/i;
var safeishPattern = /^[a-z0-9_\/\-.,?:@#%^+=\[\]{}|&()<>; *']*$/i;
function bashEscape(arg) {
  // These don't need quoting
  if (safePattern.test(arg)) return arg;

  // These are fine wrapped in double quotes using weak escaping.
  if (safeishPattern.test(arg)) return '"' + arg + '"';

  // Otherwise use strong escaping with single quotes
  return "'" + arg.replace(/'+/g, function (val) {
    // But we need to interpolate single quotes efficiently

    // One or two can simply be '\'' -> ' or '\'\'' -> ''
    if (val.length < 3) return "'" + val.replace(/'/g, "\\'") + "'";

    // But more in a row, it's better to wrap in double quotes '"'''''"' -> '''''
    return "'\"" + val + "\"'";

  }) + "'";
}


function say(text) {
    var safeMessage = bashEscape(text);
    safeMessage.replace(/ö/g, 'o');
    safeMessage.replace(/ä/g, 'a');

    console.log('Using engine:', process.env.HUBOT_SPEECH_ENGINE);
    console.log('Speaking message:', text);
    if (process.env.HUBOT_SPEECH_ENGINE === 'espeak') {
        command = 'espeak -ven+f3 -k5 -s150 "' + safeMessage + '"';
    } else if (process.env.HUBOT_SPEECH_ENGINE === 'festival') {
        command = 'echo "' + safeMessage + '" | festival --tts';
    } else if (process.env.HUBOT_SPEECH_ENGINE === 'google') {
        command = '/bin/bash scripts/speech.sh ' + safeMessage;
    } else {
        msg.send("Unknown speech engine.");
    }

    exec(command, puts);
}

module.exports = function(robot) {
    robot.hear(/SAY (.*)$/i, function(msg) {
        console.log(msg.message.user.name, 'called say');
        say(msg.match[1]);
    });

    robot.hear(/(.*)$/i, function(msg) {
        var name = msg.message.user.name.toLowerCase();

        if (_.contains(name, process.env.HUBOT_LISTEN_NAME.toLowerCase())) {
            console.log(msg.message.user.name, 'is the one to listen');
            say(msg.match[1]);
        }
    });
};
