'use strict';

document.addEventListener('DOMContentLoaded', function() {
  // By default, load the inbox
  load_mailbox('inbox');
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

});

// Display the contents of an email given the email and mailbox using the reading view.
function read_email(email, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reading-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#reading-view-header').textContent = `Email - ${mailbox[0].toUpperCase() + mailbox.substring(1)}`;
  document.querySelector('#archive-mail').textContent = (mailbox === 'archive') ? "Unarchive Mail" : "Archive Mail";

  let unreadButton = document.querySelector('#unread-mail');
  let archiveButton = document.querySelector('#archive-mail');
  let replyButton = document.querySelector('#reply-mail');
  let forwardButton = document.querySelector('#forward-mail');

  // enable / Disable buttons depending on the mailbox the mail is from.
  if (mailbox === 'inbox') {
    replyButton.disabled = false;
    forwardButton.disabled = false;
    unreadButton.disabled = false;
    archiveButton.disabled = false;
  }
  if (mailbox === 'sent') {
    replyButton.disabled = true;
    forwardButton.disabled = false;
    unreadButton.disabled = true;
    archiveButton.disabled = true;
  }
  if (mailbox === 'archive') {
    replyButton.disabled = false;
    forwardButton.disabled = false;
    unreadButton.disabled = true;
    archiveButton.disabled = false;
  }

  // Mark the message as read, if the message is from the inbox and has not been read.
  if (!email.read && mailbox === 'inbox') {
    const putMsg = {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    }

    updateMsg(email, putMsg).then(result => {
      return result;
      //alert("Message maeked as read!");
    });
  }
  // Display content of the email.
  document.querySelector('#reading-ts').textContent = `Received at: ${email.timestamp}`;
  document.querySelector('#reading-sender').value = email.sender;
  document.querySelector('#reading-recipients').value = email.recipients;
  document.querySelector('#reading-subject').value = email.subject;
  document.querySelector('#reading-body').value = email.body;

  // Add listeners to the various buttons depending on the mailbox the mail is from.
  if (mailbox !== 'sent') {
    unreadButton.onclick = function() {
      const putMsg = {
        method: 'PUT',
        body: JSON.stringify({
          read: false
        })
      }
      updateMsg(email, putMsg).then(result => {
        //alert("Message marked as Unread!");
        load_mailbox('inbox');
        return result;
      });

    };

    archiveButton.onclick = function() {
      const putMsg = {
        method: 'PUT',
        body: JSON.stringify({
          archived: (mailbox === 'archive') ? false : true
        })
      }
      updateMsg(email, putMsg).then(result => {
        //alert((mailbox === 'archive') ? "Unarchived" : "Archived");
        load_mailbox('inbox');
        return result;

      });
    };

    replyButton.onclick = () => replyHandler(email, mailbox);
  }

  forwardButton.onclick = () => forwardHandler(email, mailbox);
}

// Function handles a PUT message
function updateMsg(email, putMsg) {

  let putStatus = fetch(`emails/${email.id}`, putMsg)
    .then(response => {
      if (response.status === 204) {
        return Promise.resolve(true);
      } else {
        console.log(`Put Error: ${response.statusText}`)
        alert(`Put Error: ${response.statusText}`);
        return Promise.reject(new Error(response.statusText));
      }
    }).catch(error => alert(`Put Catch Error: ${error}`));

  return putStatus;
}

// Given the email, display the mail in the compose view for reply.
function replyHandler(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reading-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Set fields values for the reply email
  document.querySelector('#compose-view-header').textContent = "Reply Email";
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = (email.subject.substring(0, 3) === "Re:") ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n ${email.body}`;

  // Add handler to send the mail when the form is submit.
  document.querySelector('#compose-form').onsubmit = () => {
    send_mail('/emails');
    return false;
  };
}

// Given the email, display the mail in the compose view for forwarding.
function forwardHandler(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reading-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Set fields values for the forwarding of email
  document.querySelector('#compose-view-header').textContent = "Forward Email";
  document.querySelector('#compose-recipients').value = "";
  document.querySelector('#compose-subject').value = (email.subject.substring(0, 3) === "Fw:") ? email.subject : `Fw: ${email.subject}`;
  document.querySelector('#compose-body').value = `\n\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n ${email.body}`;

  // Add handler to send the mail when the form is submit.
  document.querySelector('#compose-form').onsubmit = () => {
    send_mail('/emails');
    return false;
  };
}

// Function to compose email.
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#reading-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-view-header').textContent = "New Email";
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add handler to send the mail when the form is submit.
  document.querySelector('#compose-form').onsubmit = () => {
    if (validate_email()) {
      send_mail('/emails');
      return false;
    } else {
      return false;
    }
  };
}

function validate_email() {
  const emailTo = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Basic field valdation.
  if (emailTo.length === 0) {
    alert('At least one recipient required.');
    return false;
  }

  let recipients = emailTo.split(',');
  recipients.forEach(function(item, index, array) {
    array[index] = item.trim();
  });

  document.querySelector('#compose-recipients').value = recipients.join(',');

  for (const recipient of recipients) {
    if (!validateEmailAddressFormat(recipient)) {
      alert(`this email doesn't seem right, please correct: ${recipient}`)
      return false;
    }
  }

  if (subject.length === 0) {
    alert('You need to provide a subject for the email.');
    return false
  }

  if (body.length === 0) {
    if (!confirm('Body of you mail is empty. Do you want to continue?')) {
      return false;
    }
  }

  return true;
}
// Function: Send Email.
// Does basic email format validation, ensure subject exist, and warn if body is empty.
function send_mail(url) {

  //format the post message.
  let emailData = {
    recipients: document.querySelector('#compose-recipients').value,
    subject: document.querySelector('#compose-subject').value,
    body: document.querySelector('#compose-body').value
  }

  const postMsg = {
    method: "POST",
    body: JSON.stringify(emailData)
  }

  //Post the message to the server.
  let fetchStatus = fetch(url, postMsg)
    .then(response => {
      if (response.status === 201) {
        response.json()
          .then(result => {
            console.log(`Response Message: ${result.message}`)
            alert(`Response Message: ${result.message}`);
            load_mailbox('sent');
            return Promise.resolve(true);
          });
      } else {
        response.json()
          .then(result => {
            console.log(`Error Message: ${result.error}`)
            alert(`Error Message: ${result.error}`);
            return Promise.reject(new Error(response.statusText));
          });
      }
    }).catch(error => alert(`Send Mail Catch Error: ${error}`));

    return fetchStatus;
}

// Given the mailbox name, this function load all messages in the maibox for the users.
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#reading-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Fetch the messages
  let emailList = [];
  fetch(`emails/${mailbox}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .then(result => {
      emailList = result;

      //Setup a table to display the emails received.
      let emailView = document.querySelector('#emails-view');

      let emailTableDiv = document.createElement('div');
      emailTableDiv.id = "emailTableDiv";
      emailTableDiv.className = "table-responsive";
      emailTableDiv.style.cssText = `height: ${window.innerHeight - 200}px; overflow: auto;`;
      // emailsTableDiv.innerHTML = "<p>emailsTablesDiv - Check Table</p>";

      let emailTable = document.createElement("table");
      emailTable.id = "emailTable";
      emailTable.className = "table table-bordered table-hover table-sm";

      let emailThead = document.createElement("thead");
      emailThead.id = "emailThead";
      emailThead.className = "bg-dark text-light";
      emailThead.style.cssText = "position: sticky; top: 0";

      let emailHeadTr = document.createElement("tr");

      let emailTdSender = document.createElement("td");
      emailTdSender.className = "col-sm-3";
      if (mailbox === "sent") {
        emailTdSender.textContent = "To";
      } else {
        emailTdSender.textContent = "From";
      }
      let emailTdSub = document.createElement("td");
      emailTdSub.className = "col-sm-6";
      emailTdSub.textContent = "Subject";

      let emailTdTS = document.createElement("td");
      emailTdTS.className = "col-sm-3";
      if (mailbox === "sent") {
        emailTdTS.textContent = "Time Sent";
      } else {
        emailTdTS.textContent = "Time Received";
      }

      let emailTbody = document.createElement("tbody");

      for (let em of emailList) {
        let emBodyTr = document.createElement("tr");
        if (em.read) {
          emBodyTr.style.cssText = "background-color:  LightGrey;"
        }
        //Setup up a event handler for each row. When clicked, display
        //the click email in the reading view.
        emBodyTr.addEventListener('click', function() {
          read_email(em, mailbox);
        });

        let emBodyTdSender = document.createElement("td");
        emBodyTdSender.className = "col-sm-3";
        if (mailbox === 'sent') {
          // Display the recipient email for sent mails.
          emBodyTdSender.textContent = em.recipients;
        } else {
          emBodyTdSender.textContent = em.sender;
        }

        let emBodyTdSub = document.createElement("td");
        emBodyTdSub.className = "col-sm-6";
        emBodyTdSub.textContent = em.subject;

        let emBodyTdTS = document.createElement("td");
        emBodyTdTS.className = "col-sm-3";
        emBodyTdTS.textContent = em.timestamp;


        emBodyTr.appendChild(emBodyTdSender);
        emBodyTr.appendChild(emBodyTdSub);
        emBodyTr.appendChild(emBodyTdTS);
        emailTbody.appendChild(emBodyTr);

      }

      emailView.appendChild(emailTableDiv);
      emailTableDiv.appendChild(emailTable);
      emailTable.appendChild(emailThead);
      emailThead.appendChild(emailHeadTr);
      emailHeadTr.appendChild(emailTdSender);
      emailHeadTr.appendChild(emailTdSub);
      emailHeadTr.appendChild(emailTdTS);
      emailTable.appendChild(emailTbody);

    }).catch(error => alert(`Get Inbox Catch Error: ${error}`));
}

// Basic validation of email format before sending to server.
function validateEmailAddressFormat(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
