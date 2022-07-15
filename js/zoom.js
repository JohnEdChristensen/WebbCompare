// Proof of concept by Illya Moskvin Modified by John Christensen
// v1 - 2022 - 

// MIT License, free (gratis and libre) for any use, we take no responsibility, etc.
// This example was updated in 2021 to not require jQuery.

// You can see this slider in use on the AIC website:
// https://www.artic.edu/articles/921/caring-for-two-woodcuts-by-martin-puryear

// Originally inspired by the following:
//https://codepen.io/imoskvin/pen/yOXqvO
// https://codyhouse.co/gem/css-jquery-image-comparison-slider/


function createView(sources) {

    const viewerElement = document.getElementById('container');
    const handleElement = viewerElement.querySelector('.m-image-slider__handle');


    let viewer;
    let middle;

    let leftImage = null;
    let rightImage = null;

    let leftRect = new OpenSeadragon.Rect(0, 0, 0, 0);
    let rightRect = new OpenSeadragon.Rect(0, 0, 0, 0);

    let oldSpringX = 0.5;

    initViewer();

    function initViewer() {
        viewer = OpenSeadragon({
            element: viewerElement,
            xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
            prefixUrl: "openseadragon/images/",
            zoomPerClick: 1.3, // 1, // 2.0
            showZoomControl: true,
            showFullPageControl: true,
            showRotationControl: false,
            showSequenceControl: false,
        });

        middle = new OpenSeadragon.Point(viewerElement.clientWidth / 2, viewerElement.clientHeight / 2);

        viewer.addHandler('animation-start', imagesClip);
        viewer.addHandler('animation', imagesClipAggressive);

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
    }
  

  // Loading Indicator
    function areAllFullyLoaded() {
        var tiledImage;
        var count = viewer.world.getItemCount();
        for (var i = 0; i < count; i++) {
            tiledImage = viewer.world.getItemAt(i);
            if (!tiledImage.getFullyLoaded()) {
                return false;
            }
        }
        return true;
    }

    var isFullyLoaded = false;

    function updateLoadingIndicator() {
        // Note that this function gets called every time isFullyLoaded changes, which it will do as you 
        // zoom and pan around. All we care about is the initial load, though, so we are just hiding the 
        // loading indicator and not showing it again. 
        if (isFullyLoaded) {
            document.querySelector('.loading').style.display = 'none';
        }
    }

    viewer.world.addHandler('add-item', function (event) {
        var tiledImage = event.item;
        tiledImage.addHandler('fully-loaded-change', function () {
            var newFullyLoaded = areAllFullyLoaded();
            if (newFullyLoaded !== isFullyLoaded) {
                isFullyLoaded = newFullyLoaded;
                updateLoadingIndicator();
            }
        });
    });

    function updateMiddle(offset) {
        middle.x = offset;
    }

    function imagesLoaded() {
        if (leftImage && rightImage) {
            leftRect.height = leftImage.getContentSize().y;
            rightRect.height = rightImage.getContentSize().y;
            imagesClip();
            initClip();
        }
    }

    function imagesClip() {
        let rox = rightImage.viewerElementToImageCoordinates(middle).x;
        let lox = leftImage.viewerElementToImageCoordinates(middle).x;

        rightRect.x = rox;
        rightRect.width = rightImage.getContentSize().x - rox;

        leftRect.width = lox;

        leftImage.setClip(leftRect);
        rightImage.setClip(rightRect);
    }

    function imagesClipAggressive() {
        if (!rightImage || !leftImage) {
            window.setTimeout(imagesClipAggressive, 200);
            return;
        }

        let newSpringX = viewer.viewport.centerSpringX.current.value;
        let deltaSpringX = newSpringX - oldSpringX;
        oldSpringX = newSpringX;

        let fixedMiddle = viewer.viewport.viewerElementToViewportCoordinates(middle);
        fixedMiddle.x += deltaSpringX;

        let rox = rightImage.viewportToImageCoordinates(fixedMiddle).x;
        let lox = leftImage.viewportToImageCoordinates(fixedMiddle).x;

        imagesClipShared(rox, lox);
    }

    function imagesClip() {
        if (!rightImage || !leftImage) {
            window.setTimeout(imagesClip, 200);
            return;
        }

        let rox = rightImage.viewerElementToImageCoordinates(middle).x;
        let lox = leftImage.viewerElementToImageCoordinates(middle).x;

        imagesClipShared(rox, lox);
    }

    function imagesClipShared(rox, lox) {
        rightRect.x = rox;
        rightRect.width = rightImage.getContentSize().x - rox;

        leftRect.width = lox;

        leftImage.setClip(leftRect);
        rightImage.setClip(rightRect);
    }

    function initClip() {
        // We will assume that the width of the handle element does not change
        let dragWidth = handleElement.offsetWidth;

        // However, we will track when the container resizes
        let containerWidth, containerOffset, minLeft, maxLeft;

        function updateContainerDimensions() {
            containerWidth = viewerElement.offsetWidth;
            containerOffset = viewerElement.getBoundingClientRect().left + window.scrollX;
            minLeft = containerOffset + 10;
            maxLeft = containerOffset + containerWidth - dragWidth - 10;

            // Spoof the mouse events
            let offset = handleElement.getBoundingClientRect().left + window.scrollX + dragWidth / 2;
            let event;

            // Bind the drag event
            event = new Event('mousedown');
            event.pageX = offset;

            handleElement.dispatchEvent(event);

            // Execute the drag event
            event = new Event('mousemove');
            event.pageX = offset;

            viewerElement.dispatchEvent(event);

            // Unbind the drag event
            handleElement.dispatchEvent(new Event('mouseup'));
        }

        // Retrieve initial container dimention
        updateContainerDimensions();

        // Bind the container resize
        window.addEventListener('resize', updateContainerDimensions);

        function handleTouchStart(event) {
            handleStartShared(event.targetTouches[0].pageX);
        }

        function handleMouseDown(event) {
            handleStartShared(event.pageX);
        }

        function handleStartShared(pageX) {
            let xPosition = handleElement.getBoundingClientRect().left + window.scrollX + dragWidth - pageX;

            function trackDragMouse(event) {
                trackDragShared(event.pageX);
            }

            function trackDragTouch(event) {
                trackDragShared(event.changedTouches[0].pageX);
            }

            function trackDragShared(pageX) {
                let leftValue = pageX + xPosition - dragWidth;

                // Constrain the draggable element to move inside its container
                leftValue = Math.max(leftValue, minLeft);
                leftValue = Math.min(leftValue, maxLeft);

                let widthPixel = (leftValue + dragWidth / 2 - containerOffset);
                let widthFraction = widthPixel / containerWidth;
                let widthPercent = widthFraction * 100 + '%';

                handleElement.style.left = widthPercent;

                updateMiddle(widthPixel);
                imagesClip();
            }

            viewerElement.addEventListener('mousemove', trackDragMouse);
            viewerElement.addEventListener('touchmove', trackDragTouch);

            function unbindTrackDrag(event) {
                viewerElement.removeEventListener('mousemove', trackDragMouse);
                viewerElement.removeEventListener('touchmove', trackDragTouch);
            }

            document.addEventListener('mouseup', unbindTrackDrag, { once: true });
            document.addEventListener('touchend', unbindTrackDrag, { once: true });

            event.preventDefault();
        }

        handleElement.addEventListener('mousedown', handleMouseDown);
        handleElement.addEventListener('touchstart', handleTouchStart);
    }
}
