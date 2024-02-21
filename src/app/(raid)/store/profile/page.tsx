"use client";

import * as React from 'react';
import { Alert, Box, Button, Container, Paper, Snackbar, TextField,
  Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../../utils/httpUtil";
import  "../../../../utils/string.extension";
import * as StoreContract from "../../../../../backend/contract/stock/store";
import * as CommonContract from "../../../../../backend/contract/common";

export default function UserProfilePage() {
  const [pageSuccess, setPageSuccess] = React.useState("");
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [store, setStore] = React.useState({} as StoreContract.GetStoreApiResponseBody);
  const [storeNameError, setStoreNameError] = React.useState("");

  const pageSuccessClose = () => {
    setPageSuccess("");
  };

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchStore = async () => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<
      StoreContract.GetStoreApiResponseBody>(
      `/stores/${HttpUtil.getCookieValue("sessionId")}/current`);

    if(responseStatus === 200) {
      setStore(responseBody);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading store profile. Please try again.");
    }
  }

  const storeNameChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if(event.target.value.length <= 200) {
      let newStore = {...store};
      newStore.name = event.target.value;
      setStore(newStore);
      setStoreNameError("");
    }
  }

  const storeDeliveryLeadDayChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const [leadDayIsValid, leadDayValue] = String.tryGetInteger(event.target.value);

    if(leadDayIsValid && leadDayValue >= 0 && leadDayValue <= 100) {
      let newStore = {...store};
      newStore.deliveryLeadDay = leadDayValue;
      setStore(newStore);
    }  
  }

  const saveStoreClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Validate
    if(store.name.length === 0) {
      setStoreNameError("This is required.");
    }

    if(store.name.length === 0) {
      setPageError("Please correct the errors before saving.");
      return;
    }

    // Save
    const [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
      StoreContract.SaveStoreApiRequestBody,
      CommonContract.SaveRecordApiResponseBody>(
        `/stores`,
        new StoreContract.SaveStoreApiRequestBody(
          store.name,
          store.deliveryLeadDay,
          store.versionNumber
        ));

    if(responseStatus === 200) {
      setPageSuccess("Your store is successfully saved!");
      setIsLoadingResult(true);
      fetchStore();
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": There is a problem saving your store. Please reload the page and try again.");
    }
  }

  React.useEffect(() => {
    fetchStore();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        { !isLoadingResult &&
          <Paper sx={{display: 'flex', flexDirection: 'column', gap: 4, p: 4, width: '100%'}}>
            <TextField
              variant="outlined"
              label="Store Name"
              value={store.name}
              size="small"
              error={storeNameError !== ""}
              helperText={storeNameError}
              onChange={storeNameChange} />
            <TextField
              variant="outlined"
              type="number"
              label="Delivery Lead Day"
              value={store.deliveryLeadDay}
              size="small"
              sx={{width: 240}}
              onChange={storeDeliveryLeadDayChange} />
            <Button
              variant="contained"
              sx={{width: 'fit-content'}}
              onClick={saveStoreClick}>
              Save Store
            </Button>
          </Paper>
        }
      </Box>
      <Snackbar
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
        open={pageSuccess !== ""}
        autoHideDuration={5000}
        onClose={pageSuccessClose}
        message={pageSuccess}>
        <Alert onClose={pageSuccessClose} severity="success">
          {pageSuccess}
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
        open={pageError !== ""}
        autoHideDuration={5000}
        onClose={pageErrorClose}
        message={pageError}>
        <Alert onClose={pageErrorClose} severity="error">
          {pageError}
        </Alert>
      </Snackbar>
    </Container>
  );
}