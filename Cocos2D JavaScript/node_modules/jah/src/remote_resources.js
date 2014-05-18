"use strict"

var util = require('./index'),
    events = require('events')

function RemoteResource(url, path) {
    this.url = url
    this.path = path
}

/**
 * Load the remote resource via ajax
 */
RemoteResource.prototype.load = function () {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            __jah__.resources[this.path].data = xhr.responseText
            __jah__.resources[this.path].loaded = true

            events.trigger(this, 'load', this)
        }
    }.bind(this)

    xhr.open('GET', this.url, true)  
    xhr.send(null)
}

function RemoteImage(url, path) {
    RemoteResource.apply(this, arguments)
}

RemoteImage.prototype = Object.create(RemoteResource.prototype)

RemoteImage.prototype.load = function () {
    var img = new Image()
    __jah__.resources[this.path].data = img

    img.onload = function () {
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)

    img.onerror = function () {
        console.warn("Failed to load resource: [%s] from [%s]", this.path, img.src)
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)
    
    img.src = this.url

    return img
}

function RemoteScript(url, path) {
    RemoteResource.apply(this, arguments)
}

RemoteScript.prototype = Object.create(RemoteResource.prototype)

RemoteScript.prototype.load = function () {
    var script = document.createElement('script')
    __jah__.resources[this.path].data = script

    script.onload = function () {
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)

    script.src = this.url
    document.getElementsByTagName('head')[0].appendChild(script)

    return script
}

exports.getRemoteResource = function getRemoteResource(resourcePath) {
    var resource = __jah__.resources[resourcePath]

    if (!resource) {
        return null
    }

    if (resource.remoteResource) {
        return resource.remoteResource
    }

    var RemoteObj
      , mime = resource.mimetype.split('/')

    if (mime[0] == 'image') {
        RemoteObj = RemoteImage
    } else if(mime[1] == 'javascript') {
        RemoteObj = RemoteScript
    } else {
        RemoteObj = RemoteResource
    }

    resource.remoteResource = new RemoteObj(resource.data, resourcePath)

    return resource.remoteResource
}

exports.RemoteImage = RemoteImage
exports.RemoteResource = RemoteResource
exports.RemoteScript = RemoteScript

