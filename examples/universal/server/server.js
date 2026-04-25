/* eslint-disable no-console, no-use-before-define */

import Express from 'express'
import qs from 'qs'

import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from '../webpack.config'

import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'

import configureStore from '../common/store/configureStore'
import App from '../common/containers/App'
import { fetchCounter } from '../common/api/counter'

const app = new Express()
const port = 8080

// Use this middleware to set up hot module reloading via webpack.
const compiler = webpack(webpackConfig)
app.use(
  webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  })
)
app.use(webpackHotMiddleware(compiler))

// Parse URL-encoded bodies (from forms)
app.use(Express.urlencoded({ extended: false }))

const renderApp = (req, res) => {
  // Query our mock API asynchronously
  fetchCounter(apiResponse => {
    // Read the counter from the request, if provided
    const params = qs.parse(req.query)
    const bodyCount = req.body && req.body.counter
    const counter = parseInt(params.counter, 10) || parseInt(bodyCount, 10) || apiResponse || 0

    // Compile an initial state
    const preloadedState = { count: counter }

    // Create a new Redux store instance
    const store = configureStore(preloadedState)

    // Render the component to a string
    const html = renderToString(
      <Provider store={store}>
        <App />
      </Provider>
    )

    // Grab the initial state from our Redux store
    const finalState = store.getState()

    // Send the rendered markup and state as a JSON response
    res.json({ markup: html, state: finalState })
  })
}

// This is fired every time the server side receives a request
app.use(renderApp)

app.listen(port, error => {
  if (error) {
    console.error(error)
  } else {
    console.info(
      `==> 🌎  Listening on port ${port}. Open up http://localhost:${port}/ in your browser.`
    )
  }
})
