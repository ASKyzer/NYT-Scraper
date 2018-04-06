$(document).ready(function () {

  // Handle scrape button
  $("#scrape").click(function() {
    $.ajax({
      url: "/scrape",
      method: "GET"
    }).done(function(data) {
      console.log(data);
      window.location="/"

    })


  }) // end of on click function for scrape button

// Handle save button
$(".save").click(function() {
  var savedArticleId = $(this).attr("data-id");
  $.ajax({
    url: "/articles/saved/" + savedArticleId,
    method: "POST"
  }).done(function(data) {
    console.log(data);
    window.location="/"
  })
})


//Handle Delete Article button
$(".delete").on("click", function() {
    var savedArticleId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + savedArticleId
    }).done(function(data) {
        window.location = "/saved"
    })
  }) // end of delete on click function



}); // end of document.ready()
