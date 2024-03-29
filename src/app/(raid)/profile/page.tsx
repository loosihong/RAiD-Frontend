"use client";

import * as React from 'react';
import { Alert, Box, Button, Container, Paper, Snackbar, TextField,
  Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../utils/httpUtil";
import  "../../../utils/string.extension";
import * as UserContract from "../../../../backend/contract/admin/user";
import * as StoreContract from "../../../../backend/contract/stock/store";
import * as CommonContract from "../../../../backend/contract/common";

export default function UserProfilePage() {
  const [pageSuccess, setPageSuccess] = React.useState("");
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [user, setUser] = React.useState({} as UserContract.UserApiResponseBody);
  const [storeName, setStoreName] = React.useState("");
  const [storeNameError, setStoreNameError] = React.useState("");
  const [storeDeliveryLeadDay, setStoreDeliveryLeadDay] = React.useState(1);

  const pageSuccessClose = () => {
    setPageSuccess("");
  };

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchUser = async () => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<
      UserContract.UserApiResponseBody>(
      `/users/${HttpUtil.getCookieValue("sessionId")}/current`);

    if(responseStatus === 200) {
      setUser(responseBody);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading user profile. Please try again.");
    }
  }

  const storeNameChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if(event.target.value.length <= 200) {
      setStoreName(event.target.value);
      setStoreNameError("");
    }
  }

  const storeDeliveryLeadDayChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const [leadDayIsValid, leadDayValue] = String.tryGetInteger(event.target.value);

    if(leadDayIsValid && leadDayValue >= 0 && leadDayValue <= 100) {
      setStoreDeliveryLeadDay(leadDayValue);
    }  
  }

  const createStoreClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Validate
    if(storeName.length === 0) {
      setStoreNameError("This is required.");
    }

    if(storeName.length === 0) {
      setPageError("Please correct the errors before saving.");
      return;
    }

    // Save
    const [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
      StoreContract.SaveStoreApiRequestBody,
      CommonContract.SaveRecordApiResponseBody>(
        `/stores`,
        new StoreContract.SaveStoreApiRequestBody(
          storeName,
          storeDeliveryLeadDay,
          0
        ));

    if(responseStatus === 200) {
      setPageSuccess("Your store is successfully created! Please reload the page to view your store at the top bar.");
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": There is a problem creating your new store. Please reload the page and try again.");
    }
  }

  React.useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h4">
          User Profile
        </Typography>
        { !isLoadingResult && user.loginName !== "" && user.storeId === null &&
          <Paper sx={{display: 'flex', flexDirection: 'column', gap: 4, p: 4, width: '100%'}}>
            <Typography variant="h5">
              Create a Store
            </Typography>
            <TextField
              variant="outlined"
              label="Store Name"
              value={storeName}
              size="small"
              error={storeNameError !== ""}
              helperText={storeNameError}
              onChange={storeNameChange} />
            <TextField
              variant="outlined"
              type="number"
              label="Delivery Lead Day"
              value={storeDeliveryLeadDay}
              size="small"
              sx={{width: 240}}
              onChange={storeDeliveryLeadDayChange} />
            <Button
              variant="contained"
              sx={{width: 'fit-content'}}
              onClick={createStoreClick}>
              Create Store
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