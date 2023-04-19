import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import axios from "axios";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

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

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function App() {
  // File management
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null);

  // Submission Form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  // Alert Dialog
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // ----------- API Interaction -------------------
  //send a POST request to the local API with name and pin using Axios
  function onFormSubmit(event) {
    event.preventDefault();

    //setup config headers, url and json data for the body
    const config = {
      headers: { "Content-Type": "application/json" },
    };
    const url = `${process.env.REACT_APP_SERVER_URL}:${process.env.REACT_APP_SERVER_PORT}/signature`;
    const data = { name, pin };

    //send axios request
    axios
      .post(url, data, config)
      .then((res) => processAPIResponse(res))
      .catch((err) => processAPIResponse(err));

    setShowForm(false);
  }

  // Process the response from the backend
  function processAPIResponse(res) {
    if (res?.status == 200)
      showDialogWithMessage("Success!", "The PDF was signed!");
    else if (res?.response?.status == 401)
      showDialogWithMessage("Error!", "The pin was incorrect!");
    else if (res?.response?.status == 400)
      showDialogWithMessage("Error!", "The name must be valid.");
    else showDialogWithMessage("Error!", "An unknown error occurred...");
  }

  // Open the dialog with the given message
  function showDialogWithMessage(title, message) {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlert(true);
  }

  // ------------- File Management -------------------

  // Reset the page count and number of pages
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Set file value after upload
  function handleFileInputChange(event) {
    setFile(event.target.files[0]);
  }

  // Go back one page
  function goToPrevPage() {
    setPageNumber(Math.max(pageNumber - 1, 1));
  }

  // Advance one page
  function goToNextPage() {
    setPageNumber(Math.min(pageNumber + 1, numPages));
  }

  // --------------- Renderers ----------------------------
  // The segments of the page were divided into sections and functions only for ease of understanding.
  // No component was created as each individual segment of this app was not being reused. Nevertheless, this app could be turned into a self contained component for use in a bigger project.

  // Renders the pdf viewing segment
  function renderPdfViewer() {
    return (
      <Grid container direction="column" justify="center" alignItems="center">
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      </Grid>
    );
  }

  // Renders the top bar segment with buttons.
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
            <Grid item xs={1} justify="center" align="center">
              <Button disabled={pageNumber <= 1} onClick={goToPrevPage}>
                Prev
              </Button>
            </Grid>
            <Grid item xs={2} justify="center" align="center">
              <p>
                Page {pageNumber} of {numPages}
              </p>
            </Grid>
            <Grid item xs={1} justify="center" align="center">
              <Button disabled={pageNumber >= numPages} onClick={goToNextPage}>
                Next
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
    );
  }

  // renders the form dialog
  function renderFormDialog() {
    return (
      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <form onSubmit={onFormSubmit}>
          <DialogTitle>Sign PDF</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter your name and PIN to sign the document.
            </DialogContentText>
            <TextField
              autoFocus
              required
              margin="dense"
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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

  // Renders the alert dialog
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
      {renderFormDialog()}
      {renderAlertDialog()}
    </Container>
  );
}

export default App;
