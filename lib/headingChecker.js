var Stream = require("stream");
var Transform = Stream.Transform;
var util = require("util");
var patt = /<heading>(.+?)<\/heading>/; // Matches the line containing the heading node.

module.exports = exports = HeadingChecker;
util.inherits( HeadingChecker, Transform );

function HeadingChecker( options ) {
  this.options = options;
  this.argDelim = this.options.delim || "|||";
  this.outDelim = this.out0 ? "\0" : "\n";
  Transform.call( this );
}

HeadingChecker.prototype._transform = function( chunk, encoding, done ) {

  var input = chunk.toString();
  var inputPieces = input.split( this.argDelim );
  var filePos = inputPieces.indexOf("file");
  var skipPos = inputPieces.indexOf("skip");
  var linePos = inputPieces.indexOf("line");
  var line, matches;

  // File is play by play. No need to know the heading
  if ( skipPos >= 0 ) {

    output = [
      "file", inputPieces[filePos+1]
    ];

    this.push( output.join( this.argDelim ) + this.outDelim );
    done();

  // Unkown type of file. Check the heading.
  } else {
    if ( linePos >= 0 ) {
      line = inputPieces[linePos+1];
    }
    matches = patt.exec( line );

    // Matched <heading> node
    if ( matches ) {

      var headingNode = matches[0];
      var headingContent = matches[1];

      // Matches contents in the heading node.
      var contentMatches = /^(BC\-)?([A-Z]{1})([A-Z]{1})([A-Za-z]{1})/.exec( headingContent );

      var output = [
        "file", inputPieces[filePos+1],
        "headingNode", headingNode,
        "headingContent", headingContent,
        "secondLetter", contentMatches[3],
        "thirdLetter", contentMatches[4]
      ];

      // We might be ignoring certain secondLetter's
      if ( this.options.ignore == contentMatches[3] ) {
        done();
      } else {
        this.push( output.join( this.argDelim ) + this.outDelim );
        done();
      }
    // No <heading> node match. Don't output.
    } else {
      done();
    }
  }
};
