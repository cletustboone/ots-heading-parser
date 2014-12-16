#!/usr/bin/env node

var options = require("../lib/cli").options,
var InputReader = require("../lib/inputReader");
var FileReader = require("../lib/fileReader");
var HeadingChecker = require("../lib/headingChecker");
var split = require("split");
var inputReader;

inputReader = new InputReader( options )
  .pipe( new FileReader( options ) )
  .pipe( new HeadingChecker( options ) )
  .pipe( process.stdout );
