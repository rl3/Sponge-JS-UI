
var basedir= SpongeTools.Config.tmpdir || '/tmp/spongefiles';

var baseurl= '/static-temp';
var reBaseurl= new RegExp('^' + baseurl.replace('/', '\\/').replace('-', '\\-') + '\\/([\\w\\-\\.]+)(\\?.+)?$');

// delete tempFile after one hour
var tempFileTimeout= 60 * 60 * 1000;


var fs= Npm.require('fs');

WebApp.connectHandlers.use(function( req, res, next ) {
    var re = reBaseurl.exec(req.url);
    if ( !re ) return next();

    var filename= basedir + '/' + re[1].replace('..', '');

    var mimeType= req.query.contentType || 'application/binary';
    var destinationName= req.query.fileName || filename.split('/').pop();


    var error= function() {
        res.writeHead(404);
        res.end();
        return;
    };

    return fs.open(filename, 'r', function( err, fd ) {
        if ( err ) return error();

        var data;

        res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Disposition': 'attachment; filename=' + destinationName,
        });

        var i= 0;

        var sendFile= function() {
            var buffer= new Buffer(1024 * 1024);
            fs.read(fd, buffer, 0, buffer.length, null, function( err, num, buffer ) {
                if ( err || !num ) {
                    res.end();
                    fs.close(fd, function() {});
                    return;
                }
                res.write(buffer.slice(0, num));
                if ( i++ > 1000 ) {
                    i= 0;
                    setTimeout(sendFile, 2);
                }
                sendFile();
            });
        };
        sendFile();
    });
});


var mktemp= (function() {
    var counts= {};

    if ( fs.existsSync(basedir) ) {
        fs.readdir(basedir, function( err, files ) {
            files.forEach(function( file ) {
                fs.unlink(basedir + '/' + file, function() {});
            });
        });
    }

    return function( prefix ) {
        if ( !prefix ) prefix= 'temp';
        if ( !(prefix in counts) ) counts[prefix]= 0;

        var count= ++counts[prefix];
        if ( !fs.existsSync(basedir) ) fs.mkdirSync(basedir);

        var baseName= prefix + '-' + count + '.tmp';
        var fileName= basedir + '/' + baseName;

        setTimeout(
            function() {
                fs.exists(fileName, function( exists ) {
                    if ( !exists ) return;

                    fs.unlink( fileName, function() {});
                });
            },
            tempFileTimeout
        );

        return {
            localname: fileName,
            url: baseurl + '/' + baseName,
        };
    }
})();


SpongeTools.mktemp= mktemp;