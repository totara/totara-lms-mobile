var templates = [
    "root/externallib/text!root/plugins/download/download.html"
];

define(templates, function(downloadTpl) {
    var plugin = {
        settings: {
            name: "download",
            type: "course",
            title: "Downloadable Content",
            lang: {
                component: "core"
            },
            menuURL: "#"
        },

        templates: {
            download: { html: downloadTpl }
        },

        routes: [
            ["resource/:coursemoduleid", "", "main"]
            // [
            //     "courses/:courseid/section/:sectionId/download/:contentid",
            //     "course_contents_download", "somethingelse"
            // ],
            // [
            //     "courses/:courseid/section/:sectionId/download/:contentid/:index",
            //     "course_contents_download_folder", "somethingelse"
            // ]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.download.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.download.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }
        },

        resize: function() {
            if (MM.plugins.download.sizes == undefined) {
                MM.plugins.download._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.url.sizes.withSideBar.center,
                    'left':MM.plugins.url.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.url.sizes.withoutSideBar.center,
                    'left':MM.plugins.url.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        _cancelDownload: function(ev) {
            ev.preventDefault();
            window.history.back();
        },

        main: function(coursemoduleid) {
            var module = MM.db.get("courseModules", coursemoduleid);
            var contents = module.get('contents')[0];

            // Now, we need to download the file.
            // First we load the file system (is not loaded yet).
            MM.fs.init(function() {
                if (MM.fs.getRoot().indexOf('fake') !== -1) {
                    // We might well be on a mobile device, but we don't have direct
                    // access to the underlying storage
                    // Instead, we show the page for the download link.
                    contents.downloadURL = contents.fileurl + "&token=" + MM.config.current_token;
                    var template = MM.plugins.download.templates.download;
                    var context = {
                        module: module.toJSON(),
                        download:contents
                    };
                    var html = MM.tpl.render(template.html, context);
                    MM.panels.show("center", html);
                    MM.util.setupBackButton();
                    $(document).find('#cancel').on(
                        'click', MM.plugins.download._cancelDownload
                    );
                } else {
                    var path = MM.plugins.contents.getLocalPaths(courseId, contentId, file);
                    MM.log("Content: Starting download of file: " + downloadURL);
                    // All the functions are async, like create dir.
                    MM.fs.createDir(path.directory, function() {
                        MM.log("Content: Downloading content to " + path.file + " from URL: " + downloadURL);

                        $(downCssId).attr("src", "img/loadingblack.gif");

                        MM.moodleDownloadFile(downloadURL, path,
                            MM.plugins.download._downloadSuccessful,
                            MM.plugins.download._downloadUnsuccessful
                        );
                    });
                }
            });
        },

        _downloadSuccessful: function(fullpath) {
            MM.log("Content: Download of content finished " + fullpath + " URL: " + downloadURL);
            content.contents[index].localpath = path.file;
            MM.db.insert("contents", content);
            $(downCssId).remove();
            $(linkCssId).attr("href", fullpath);
            $(linkCssId).attr("rel", "external");
            // Android, open in new browser
            MM.handleFiles(linkCssId);
        },

        _downloadUnsuccessful: function(fullpath) {
            MM.log("Content: Error downloading " + fullpath + " URL: " + downloadURL);
            $(downCssId).attr("src", "img/download.png");
        }
    }

    MM.registerPlugin(plugin);
});
