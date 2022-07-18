//get URL paramater that tells us which images to load.
$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    return decodeURI(results[1]) || 0;
}

const target = $.urlParam("target")
switch (target) {
    case 'carina':
        webbImgName = "carina.jpg";
        hubbleImgName = "carina.png";
        document.title="Carina Nebula"
        break;
    case 'deep_field':
        webbImgName = "deep_field.png";
        hubbleImgName = "deep_field.png";
        document.title="Webb Deep Field"
        break;
    case 'southern_nebula':
        webbImgName = "southern_nebula.png";
        hubbleImgName = "southern_nebula.png";
        document.title="Southern Ring Nebula"
        break;
    case 'stephans_quintet':
    default:
        webbImgName = "stephans_quintet.jpg";
        hubbleImgName = "stephans_quintet.jpg";
        document.title="Stephan's Quintet"
        break;
}


var sources = [
    {
        type: 'image',
        url: 'img/hubble/' + hubbleImgName,
    },
    {
        type: 'image',
        url: 'img/webb/' + webbImgName,
    }
];
createView(sources);