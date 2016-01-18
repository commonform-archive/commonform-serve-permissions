module.exports = serverPermissions

var service = require('simple-json-service')
var bcrypt = require('bcrypt-password')

function serverPermissions(log, level) {
  return service(log, level, implementation) }

function implementation(log, level, input, callback) {
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
          if (!error.notFound) { callback('Database error.') }
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
    else { callback('Invalid action') } } }
