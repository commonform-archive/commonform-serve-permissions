module.exports = handler

var bcrypt = require('bcrypt-password')
var uuid = require('uuid')
var concat = require('concat-stream')

function handler(log, level) {
  return function(request, response) {
    request.log = log(uuid.v4())
    request.log.info(request)
    request
      .once('end', function() {
        request.log.info({ event: 'end', status: response.statusCode }) })
      .pipe(concat(function(buffer) {
        process(buffer, function(error, output) {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(
              error ? { error: error } : { output: output })) }) }))

    function process(buffer, callback) {
      parseJSON(buffer, function(error, input) {
        if (error) { callback('Invalid action') }
        else {
          var action = input.action
          var validInput = (
            'name' in input &&
            'password' in input &&
            input.password.length > 8 )
          var name = input.name
          var password = input.password
          if (!validInput) { callback('Invalid input.') }
          else {
           // Register a new user.
            if (action === 'register') {
              level.get(name, function(error) {
                if (!error) { callback('User already exists.') }
                else {
                  if (!error.notFound) {
                    callback('Database error.') }
                  else {
                    bcrypt.hash(password, function(error, digest) {
                      if (error) { callback('Failed to hash password.') }
                      else {
                        var value = JSON.stringify({ digest: digest })
                        level.put(name, value, function(error) {
                          if (error) { callback('Failed to store credentials.') }
                          else { callback(null, true) } }) } }) } } }) }
            // Update a registered user.
            else if (action === 'update') {
              level.get(name, function(error) {
                if (error) {
                  if (error.notFound) { callback('User not found.') }
                  else { callback('Database error') } }
                else {
                  bcrypt.hash(password, function(error, digest) {
                    if (error) { callback('Failed to hash password.') }
                    else {
                      var value = JSON.stringify({ digest: digest })
                      level.put(name, value, function(error) {
                        if (error) { callback('Failed to store credentials.') }
                        else { callback(null, true) } }) } }) } }) }
            // Check user credentials.
            else if (action === 'check') {
              level.get(name, function(error, value) {
                if (error) {
                  if (error.notFound) { callback(null, false) }
                  else { callback('Database error.') } }
                else {
                  var digest = JSON.parse(value).digest
                  bcrypt.check(password, digest, function(error, match) {
                    if (error) { callback('Hash error.') }
                    else { callback(null, match) } }) } }) }
            else { callback('Invalid action') }} } }) } } }

function parseJSON(input, callback) {
  try {
    var result = JSON.parse(input)
    callback(null, result) }
  catch (error) {
    callback(error) } }
