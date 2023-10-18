const fs = require('fs')
const resolve = require('enhanced-resolve')

const enhanced = resolve.ResolverFactory.createResolver({
    fileSystem: new resolve.CachedInputFileSystem(fs, 4000),
    extensions: ['.js', '.json'],
    useSyncFileSystemCalls: true,
    conditionNames: ['node', 'require'],
})

function resolution(request, options) {
    try {
        return enhanced.resolveSync({}, options.basedir, request, {})
    } catch {
        if (request.match(/(\w+).js$/)) {
            const noJS = request.replace(/\.js$/, '')
            return resolution(noJS, options)
        }
        // Call Jest default resolver
        return options.defaultResolver(request, options)
    }
}

module.exports = resolution
