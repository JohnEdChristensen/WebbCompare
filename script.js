// This illustrates a way to change the right-hand image for this image slider:
// https://codepen.io/imoskvin/pen/yOXqvO?editors=0010
function createView(sources) {
    var viewer = OpenSeadragon({
        id: "container",
        xmlns: "http://schemas.microsoft.com/deepzoom/2008",
        prefixUrl: "openseadragon/images/"
        /** 
            tileSources: [
                "img/webb/carina.jpg",
                "img/webb/deep_field.png",
                "img/webb/southern_nebula.jpg",
                "img/webb/carina.jpg",
                "img/webb/carina.jph",
                "img/webb/carina.jph",
            ],
            sequenceMode: true,    
            showReferenceStrip: true,
            referenceStripScroll: 'vertical',
            */
    });

    var $viewer = $('#container');


    // This returns replaceImage defined inside the function scope
    var loader = loadComparisonImages($viewer, viewer, sources);

    // This is the part that gets all wonky.
    // Try moving the slider after it fires
    /**
    var timer = 4000;
    setTimeout( loadSecond, timer );
    
    function loadFirst() {
        loader( sources[1] );
        setTimeout( loadSecond, timer );
    }
    
    function loadSecond() {
        loader( sources[2] );
        setTimeout( loadFirst, timer );
    }
    */

    // https://codepen.io/imoskvin/pen/yOXqvO?editors=0010
    function loadComparisonImages($viewer, viewer, sources) {

        var $handle = $('<span/>').addClass('slider-handle');

        $viewer.append($handle);
        $viewer.addClass('slider-container');

        var middle = new OpenSeadragon.Point($viewer.width() / 2, $viewer.height() / 2);

        function updateMiddle(offset) {
            middle.x = offset;
        }

        // Keep track of the two images we're splitting
        var leftImage = null;
        var rightImage = null;

        var leftRect = new OpenSeadragon.Rect(0, 0, 0, 0);
        var rightRect = new OpenSeadragon.Rect(0, 0, 0, 0);

        viewer.open([
            {
                //Put the Webb image as a base layer, for hubble images that are transparent
                tileSource: sources[1],
                success: function (event) {

                    imagesLoaded();

                }
            },
            {
                tileSource: sources[0],
                success: function (event) {

                    leftImage = event.item;
                    imagesLoaded();

                }
            },
            {
                tileSource: sources[1],
                success: function (event) {

                    rightImage = event.item;
                    imagesLoaded();

                }
            },
        ]);

        // Handle pan and zoom events
        viewer.addHandler('animation', function (viewer) {

            imagesClip();

        })

        // Callback function to modify what image is loaded
        var replaceImage = function (source) {

            viewer.addTiledImage({
                tileSource: source,
                success: function (event) {

                    if (rightImage) {
                        viewer.world.getIndexOfItem(rightImage);
                        viewer.world.removeItem(rightImage);
                    }

                    rightImage = event.item;
                    imagesClip();
                }
            });
        };

        // Return the callback function
        return replaceImage;

        // Basic function to check when both images are loaded
        function imagesLoaded() {
            if (leftImage && rightImage) {

                leftRect.height = leftImage.getContentSize().y;
                rightRect.height = rightImage.getContentSize().y;

                imagesClip();

                initClip();

            }
        }

        function imagesClip() {

            var rox = rightImage.viewerElementToImageCoordinates(middle).x;
            var lox = leftImage.viewerElementToImageCoordinates(middle).x;

            rightRect.x = rox;
            rightRect.width = rightImage.getContentSize().x - rox;

            leftRect.width = lox;

            leftImage.setClip(leftRect);
            rightImage.setClip(rightRect);

        }

        function initClip() {

            // TODO: Abstract this away
            var $handle = $viewer.find('.slider-handle');
            var $container = $handle.parents('.slider-container');

            // We will assume that the width of the handle element does not change
            var dragWidth = $handle.outerWidth();

            // However, we will track when the container resizes
            var containerWidth, containerOffest, minLeft, maxLeft;

            function updateContainerDimensions() {

                containerWidth = $container.outerWidth();
                containerOffset = $container.offset().left;
                minLeft = containerOffset + 10;
                maxLeft = containerOffset + containerWidth - dragWidth - 10;

            }

            // Retrieve initial container dimention
            updateContainerDimensions();

            // Bind the container resize
            $(window).resize(function () {
                updateContainerDimensions();

                // Spoof the mouse events
                var offset = $handle.offset().left + dragWidth / 2;
                var event;

                // Bind the drag event
                event = new jQuery.Event("mousedown");
                event.pageX = offset;

                $handle.trigger(event);
                // Bind the touchdrag event
                event = new jQuery.Event("touchstart");
                event.pageX = offset;

                $handle.trigger(event);


                // Execute the drag event
                event = new jQuery.Event("mousemove");
                event.pageX = offset;

                $container.trigger(event);

                // Unbind the drag event
                $handle.trigger("mouseup");

                // Execute the drag event
                event = new jQuery.Event("touchmove");
                event.pageX = offset;

                $container.trigger(event);

                // Unbind the drag event
                $handle.trigger("touchend");

            });

            // We are just going to assume jQuery is loaded by now
            // Eventually, I'll make this work without jQuery
            $handle.on("mousedown vmousedown ontouchstart", function (e) {

                var xPosition = $handle.offset().left + dragWidth - e.pageX;

                updateContainerDimensions();

                function trackDrag(e) {

                    var leftValue = e.pageX + xPosition - dragWidth;

                    //constrain the draggable element to move inside its container
                    leftValue = Math.max(leftValue, minLeft);
                    leftValue = Math.min(leftValue, maxLeft);

                    var widthPixel = (leftValue + dragWidth / 2 - containerOffset);
                    var widthFraction = widthPixel / containerWidth;
                    var widthPercent = widthFraction * 100 + '%';

                    $handle.css('left', widthPercent);

                    updateMiddle(widthPixel);
                    imagesClip();

                }

                $('html').on("mousemove vmousemove ontouchmove", trackDrag);

                $('html').one("mouseup vmouseup ontouchend", function (e) {
                    $('html').unbind("mousemove vmousemove ontouchmove", trackDrag);
                });

                e.preventDefault();

            });

        }
    }
}