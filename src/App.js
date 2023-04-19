import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Container,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@material-ui/core";
import axios from "axios";

import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function App() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  // ----------- API Interaction -------------------
  //send a POST request to the local API with username and pin using Axios
  function onFormSubmit(event) {
    event.preventDefault();

    //setup config headers, url and json data for the body
    const config = {
      headers: { "Content-Type": "application/json" },
    };
    const url = `${process.env.REACT_APP_SERVER_URL}:${process.env.REACT_APP_SERVER_PORT}/signature`;
    const data = { username, pin };

    //send axios request
    axios
      .post(url, data, config)
      .then((res) => processAPIResponse(res))
      .catch((err) => processAPIResponse(err));

    setShowForm(false);
  }

  function processAPIResponse(res) {
    if (res?.status == 200)
      showDialogWithMessage("Success!", "The PDF was signed!");
    else if (res?.response?.status == 401)
      showDialogWithMessage("Error!", "The pin was incorrect!");
    else if (res?.response?.status == 400)
      showDialogWithMessage("Error!", "The username must be valid.");
    else showDialogWithMessage("Error!", "An unknown error occurred...");
  }

  function showDialogWithMessage(title, message) {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  }

  // ------------- File Management -------------------
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function handleFileInputChange(event) {
    setFile(event.target.files[0]);
  }

  function goToPrevPage() {
    setPageNumber(Math.max(pageNumber - 1, 1));
  }

  function goToNextPage() {
    setPageNumber(Math.min(pageNumber + 1, numPages));
  }

  // --------------- Renderers ----------------------------
  // The segments of the page were divided into sections and functions only for ease of understanding.
  function renderPdfViewer() {
    return (
      <Grid container direction="column" justify="center" alignItems="center">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          renderInteractiveForms={false}
        >
          <Page
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            renderTextLayer={false}
            margin="0"
          />
        </Document>
      </Grid>
    );
  }

  function renderTopBar() {
    return (
      <Paper
        elevation={0}
        style={{
          backgroundColor: "#fafafa",
          padding: "20px",
          marginTop: "20px",
        }}
      >
        <Grid container spacing={0} alignItems="center" justifyContent="center">
          <Grid item xs={2} justify="center" align="center">
            <Button variant="contained" component="label">
              Upload File
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={handleFileInputChange}
              />
            </Button>
          </Grid>
          {file && (
            <Grid item xs={2} justify="center" align="center">
              <Button
                variant="contained"
                component="label"
                onClick={() => setShowForm(true)}
              >
                Sign PDF
              </Button>
            </Grid>
          )}
        </Grid>
        {file && (
          <Grid
            container
            spacing={0}
            alignItems="center"
            justifyContent="center"
          >
            <Grid item xs={2} justify="center" align="center">
              <Button disabled={pageNumber <= 1} onClick={goToPrevPage}>
                Prev
              </Button>
            </Grid>
            <Grid item xs={2} justify="center" align="center">
              <p>
                Page {pageNumber} of {numPages}
              </p>
            </Grid>
            <Grid item xs={2} justify="center" align="center">
              <Button disabled={pageNumber >= numPages} onClick={goToNextPage}>
                Next
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
    );
  }

  function renderDialog() {
    return (
      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <form onSubmit={onFormSubmit}>
          <DialogTitle>Sign PDF</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter your username and PIN to sign the document.
            </DialogContentText>
            <TextField
              autoFocus
              required
              margin="dense"
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              fullWidth
            />
            <TextField
              required
              margin="dense"
              label="PIN"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" color="primary">
              Sign
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderAlertDialog() {
    return (
      <Dialog
        open={showAlert}
        onClose={() => setShowAlert(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{alertTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {alertMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAlert(false)} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {renderTopBar()}
        </Grid>
        <Grid item xs={12}>
          {file && renderPdfViewer()}
        </Grid>
      </Grid>
      {renderDialog()}
      {renderAlertDialog()}
    </Container>
  );
}

export default App;
