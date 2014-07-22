define(function () {
    var plugin = {
        settings: {
            name: "upload",
            type: "general",
            icon: "plugins/upload/icon.png",
            subMenus: [
                {name: "browsephotoalbums", menuURL: "#upload/browse", icon: ""},
                {name: "takepicture", menuURL: "#upload/take", icon: ""},
                {name: "recordaudio", menuURL: "#upload/record", icon: ""}
            ],
            lang: {
                component: "core"
            },
            toogler: true
        },

        routes: [
            ["upload/browse", "upload_browse", "browseAlbums"],
            ["upload/take", "upload_take", "takeMedia"],
            ["upload/record", "upload_record", "recordAudio"],
        ],

        browseAlbums: function() {
            MM.log('Trying to get a image from albums', 'Upload');
            MM.Router.navigate("");

            var width  =  $(document).innerWidth()  - 200;
            var height =  $(document).innerHeight() - 200;

            // iPad popOver, see https://tracker.moodle.org/browse/MOBILE-208
            var popover = new CameraPopoverOptions(10, 10, width, height, Camera.PopoverArrowDirection.ARROW_ANY);

            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                popoverOptions : popover
            });
        },

        takeMedia: function() {
            MM.log('Trying to get a image from camera', 'Upload');
            MM.Router.navigate("");

            navigator.camera.getPicture(MM.plugins.upload.photoSuccess, MM.plugins.upload.photoFails, {
                quality: 50,
                destinationType: navigator.camera.DestinationType.FILE_URI
            });
        },

        recordAudio: function() {
            MM.Router.navigate("");
            MM.log('Trying to record and Audio', 'Upload');
            navigator.device.capture.captureAudio(MM.plugins.upload.recordAudioSuccess, MM.plugins.upload.recordAudioFails, {limit: 1});
        },

        photoSuccess: function(uri) {

            MM.log('Uploading an image to Moodle', 'Upload');
            var d = new Date();

            var options = {};
            options.fileKey = "file";
            options.fileName = "image_" + d.getTime() + ".jpg";
            options.mimeType = "image/jpeg";

            MM.moodleUploadFile(uri, options,
                function(){ MM.popMessage(MM.lang.s("imagestored")); },
                function(){ MM.popErrorMessage(MM.lang.s("erroruploading")) }
            );

        },

        photoFails: function(message) {
            MM.log('Error trying getting a photo', 'Upload');
            if (message.toLowerCase().indexOf("error") > -1 ||
                message.toLowerCase().indexOf("unable") > -1
            ) {
                MM.popErrorMessage(message);
            }
        },

        recordAudioSuccess: function(mediaFiles) {

            MM.log('Audio successfully recorded', 'Upload');

            var i, len;
            for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                var options = {};
                options.fileKey = null;
                options.fileName = mediaFiles[i].name;
                options.mimeType = null;

                MM.moodleUploadFile(mediaFiles[i].fullPath, options,
                    function(){
                        MM.popMessage(MM.lang.s("recordstored"));
                    },
                    function(){
                        MM.popErrorMessage(MM.lang.s("erroruploading"))
                    }
                );
            }
        },

        recordAudioFails: function(error) {
            if (!error) {
                error = { code: 0};
            }

            MM.log('Error trying recording an audio ' + error.code, 'Upload');
            if (error.code != CaptureError.CAPTURE_NO_MEDIA_FILES) {
                MM.popErrorMessage(MM.lang.s("errorcapturingaudio"));
            }
        }
    }

    MM.registerPlugin(plugin);
});