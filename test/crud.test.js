var concat = require('concat-stream')
var http = require('http')
var server = require('./server')
var series = require('async-series')
var tape = require('tape')

tape('Actions', function(test) {

  test.test('No Action', function(test) {
    test.plan(1)
    server(function(port, done) {
      var request = { method: 'POST', port: port }
      http.request(request, function(response) {
        response.pipe(concat(function(buffer) {
          var output = JSON.parse(buffer)
          test.equal(output.error, 'Invalid request', 'Error')
          done()
          test.end() })) })
      .end() }) })

  test.test('Check', function(test) {

    test.test('Check Bad Credentials', function(test) {
      test.plan(1 * 2)
      server(function(port, done) {
        var request = { method: 'POST', port: port }
        var input = {
          action: 'check',
          name: 'joe',
          password: 'just words' }
        http.request(request, function(response) {
          response.pipe(concat(function(buffer) {
            var output = JSON.parse(buffer)
            test.equal(output.error, undefined, 'No error')
            test.equal(output.output, false, 'Output is false')
            done()
            test.end() })) })
        .end(JSON.stringify(input)) }) })

    test.test('Register and Check', function(test) {
      test.plan(2 * 2)
      server(function(port, done) {
        var request = { method: 'POST', port: port }
        series(
          [ function(next) {
              var input = {
                action: 'register',
                name: 'joe',
                password: 'just words' }
              http.request(request, function(response) {
                response.pipe(concat(function(buffer) {
                  var output = JSON.parse(buffer)
                  test.equal(output.error, undefined, 'No error')
                  test.equal(output.output, true, 'Output is true')
                  next() })) })
                .end(JSON.stringify(input)) },
            function(next) {
              var input = {
                action: 'check',
                name: 'joe',
                password: 'just words' }
              http.request(request, function(response) {
                response.pipe(concat(function(buffer) {
                  var output = JSON.parse(buffer)
                  test.equal(output.error, undefined, 'No error')
                  test.equal(output.output, true, 'Output is true')
                  next() })) })
                .end(JSON.stringify(input)) } ],
          function() {
            done()
            test.end() }) }) }) }) })
