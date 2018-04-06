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
$(".delete").click(function() {
    var savedArticleId = $(this).attr("data-id");
    $.ajax({
        method: "POST",
        url: "/articles/delete/" + savedArticleId
    }).done(function(data) {
        window.location = "/saved"
    })
  }) // end of delete on click function

  // Handle Saving notes for an articles
  $(".saveNote").click(function() {
    var savedNoteId = $(this).attr("data-id");
    $.ajax({
      url: "/notes/saved/" + savedNoteId,
      method: "POST",
      data: {
        text: $("#noteText").val()
      }
    }).done(function(data) {
      console.log(data);
      // Clear the note textarea
      // $("#noteText").val("");
      // $(".modalNote").modal("hide");
      location.reload()
    })
  })

  //Handle Delete Note button
  $(".deleteNote").click(function() {
      var noteId = $(this).attr("data-note-id");
      var articleId = $(this).attr("data-article-id");
      $.ajax({
          method: "DELETE",
          url: "/notes/delete/" + noteId + "/" + articleId
      }).done(function(data) {
          console.log(data)
          $(".modalNote").modal("hide");
          window.location = "/saved"
      })
  });



}); // end of document.ready()
