var colors = require('colors')
  , sys    = require('util')

var colourMap = { magenta: 'cyan'
                , info:    'green'
                , notice:  'cyan'
                , warn:    'yellow'
                , error:   'red'
                }

exports.ENABLE_DEBUG = false

function log_msg(type, label, message, align) {
    var output = ''

    if (typeof label == 'undefined') {
        message = type
        type = label = null
    }
    else if (typeof message == 'undefined') {
        message = label
        label = type
        type = null
    }

    var prefix = groupPrefix()
    if (!align && align !== 0) {
        align = 20
    }
    align -= prefix.length

    if (label) {
        var labelLen = label.replace(/\033\[.*?m/g, '').length
        label += ': '
        if (labelLen < align) {
            label += (new Array(align - labelLen).join(' '))
        }
        if (label && type) {
            output += '  ' + prefix + label[colourMap[type]]
        } else if (label) {
            output += '  ' + prefix + label
        }
    }

    output += message
    return sys.puts(output)
}

function groupPrefix () {
    if (exports.depth <= 0) {
        return ''
    }
    var prefix = ''
    for (var i=1; i<exports.depth; i++) {
        prefix += '    '
    }
    prefix += '`- '

    return prefix
}

exports.log = function (label, message) {
    if (arguments.length == 0) {
        message = ''
        label = null
    } else if (arguments.length == 1) {
        message = label
        label = null
    }
    return log_msg(label, message)
}
exports.info = function (label, message) {
    return log_msg('info', label, message || '')
}
exports.warn = function (label, message) {
    return log_msg('warn', label, message || '')
}
exports.error = function (label, message) {
    return log_msg('error', label, message || '')
}
exports.notice = function (label, message) {
    return log_msg('notice', label, message || '')
}
exports.debug = function (label, message) {
    if (exports.ENABLE_DEBUG) {
        return log_msg('debug', label, message || '')
    } else {
        return;
    }
}
exports.group = function () {
    if (exports.depth == 0) {
        exports.log()
    }
    if (arguments.length > 0) {
        exports.info.apply(this, arguments)
    }
    exports.depth++
}
exports.ungroup = function () {
    if (arguments.length > 0) {
        exports.info.apply(this, arguments)
    }
    exports.depth--
    if (exports.depth == 0) {
        exports.log()
    }
}
exports.depth = 0
