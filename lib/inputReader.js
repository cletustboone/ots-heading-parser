var Stream = require("stream");
var Transform = Stream.Transform;
var split = require("split");
var util = require("util");
var path = require("path");
var fs = require("fs");

module.exports = exports = Reader;

util.inherits( Reader, Transform );

function Reader( options ) {
  this.options = options;
  this.inDelim = this.options.in0 ? "\0" : "\n";
  this.outDelim = this.options.out0 ? "\0" : "\n";
  this.inDelimCharCode = this.options.in0 ? 0 : 10;
  this.argDelim = this.options.delim || "|||";
  Transform.call( this );
  this.checkInput();
}

// Figure out if input is coming from stdin or from command line options or both
Reader.prototype.checkInput = function() {
  if ( this.options.file ) {
    var pieces = [
      "file",
      this.options.file,
      "in0",
      this.options.in0 || false,
      "out0",
      this.options.out0 || false
    ];
    var stream = new Stream();

    stream.pipe = function( dest ) {
      dest.write( pieces.join( this.argDelim ) + this.inDelim, "utf8" );
      return this;
    }.bind( this );

    stream.pipe( this );
  // File was not passed in on command line. Now there are two options
  //   1. Maybe it is being fed in from the find command.
  //   2. Input is arriving from the filename reader and is already in the expected format.
  } else {
    process.stdin
      .pipe( split( this.inDelim ) )
      .pipe( this );
  }
};

// Use transform to guarantee that what our fileReader sees is a complete line of input.
Reader.prototype._transform = function( chunk, encoding, done ) {

  var
  input = chunk.toString(),
  inputPieces = input.split( this.argDelim ),
  filePos = inputPieces.indexOf( "file" ),
  output = input;

  // Input might be coming from find. Prepend file argument if so.
  if ( filePos < 0 ) {
    output = "file" + this.argDelim + input;
  }
  this.push( output );
  done();

};
