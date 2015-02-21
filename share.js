var Share = (function () {
    "use strict";

    function post(url, data, cb) {
        function loadend () {
            cb(JSON.parse(this.responseText));
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xhr.send(JSON.stringify(data));
        xhr.addEventListener("loadend", loadend, false);
    }

    var share = {};
    var inputBox = document.querySelector("#data");

    share.shorten = function () {
        document.querySelector("#share-url").value = "Haetaan linkkiä...";
        var url = window.location.protocol + "//" + window.location.host + window.location.pathname + "#";
        url += encodeURIComponent(inputBox.value);
        post("http://api.lyli.fi", {url: url}, function(resp) {
            document.querySelector("#share-url").value = resp["short-url"];
        });
    };

    share.checkURL = function () {
        if(location.hash.length == 0) {
            return;
        }
        inputBox.value = decodeURIComponent(location.hash.substring(1));
        var event = document.createEvent("HTMLEvents");
        event.initEvent("input", true, true);
        inputBox.dispatchEvent(event);
    };

    return share;
}());

Share.checkURL();

document.querySelector("#share-button").addEventListener("click", function() {
    Share.shorten();
});