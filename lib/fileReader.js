var Stream = require("stream");
var Transform = Stream.Transform;
var Duplex = Stream.Duplex;
var util = require("util");
var path = require("path");
var fs = require("fs");
var split = require("split");
var HeadingChecker = require("./headingChecker");

module.exports = exports = FileReader;
util.inherits( FileReader, Transform );

function FileReader( options ) {

  this.options = options;
  this.argDelim = this.options.delim || "|||";
	Transform.call( this );

}

FileReader.prototype._transform = function( chunk, encoding, done ) {

  var input = chunk.toString();
  var ouput;

  if ( input.indexOf( this.argDelim ) >= 0 ) {

    var inputPieces = input.split( this.argDelim );
    var filePos = inputPieces.indexOf("file");
    var inZeroPos = inputPieces.indexOf("in0");
    var outZeroPos = inputPieces.indexOf("out0");

    // this.outDelim = this.outZero ? "\0" : "\n";
    if ( filePos >= 0 ) {

      this.fileName = inputPieces[filePos+1];
      this.cleanFileName();

    } else {

      process.exit(0);

    }

    // Play by play files don't have a <heading> node. They can be identified
    // by the file name. If this is a pbp file, just pass the file through
    // with the `skip` option so we don't check the heading.
    if ( this.isPbp() ) {

      output = [
        "file", this.fileName,
        "skip", "true"
      ];

      // This output goes to the heading checker.
      this.push( output.join( this.argDelim ) );
      done();

    } else {

      // Return a readable stream
      var
      readable = this.readFileIn()
        .pipe( split() )
        .on( "data", function( line ) {
          output = [
            "file", this.fileName,
            "line", line+""
          ];
          this.push( output.join( this.argDelim ) );
          this.push( line );
        }.bind( this ))
        .on( "error", function( err ) {
          done();
        });
      readable.on( "end", function() {
        done();
      });

    }

  } else {

    process.exit(1);

  }

};

// Set up a resolved path to the file in case arguments came in from options.
// The ots-sn-filename-reader already does this, but input might not come from here.
FileReader.prototype.cleanFileName = function() {
  this.normalized   = path.normalize( this.fileName );
  this.resolvedPath = path.resolve( process.cwd(), this.normalized );
  this.basename     = path.basename( this.resolvedPath );
};

// Return a readable stream of file contents
FileReader.prototype.readFileIn = function() {
  var
  stats = fs.statSync( this.resolvedPath );

  if ( fs.existsSync( this.resolvedPath ) && stats.isFile() ) {
    return fs.createReadStream( this.resolvedPath );
  } else {
    process.exit();
  }
};

FileReader.prototype.isPbp = function() {
  return /^[A-Z]{2}\-/.test( this.basename );
};
