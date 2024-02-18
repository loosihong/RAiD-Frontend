"use client";

import * as React from "react";
import { Alert, Box, Button, Container, FormControl, FormHelperText, InputLabel, MenuItem, Paper,
  Snackbar, Select, SelectChangeEvent, Typography } from "@mui/material";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../utils/httpUtil";
import * as UserContract from "../../backend/contract/admin/user";

export default function Home() {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [loginName, setLoginName] = React.useState("");
  const [loginNameError, setLoginNameError] = React.useState("");  

  const pageErrorClose = () => {
    setPageError("");
  };

  const loginNameSelectChange = (event: SelectChangeEvent) => {
    setLoginName(event.target.value);
    setLoginNameError(event.target.value === "" ? "This is required!" : "");
  };

  const loginButtonClick = async () => {
    if(loginName === "") {
      setLoginNameError("This is required!");
      return;
    }

    setLoginNameError("");
    setPageError("");

    const [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
      UserContract.UserLoginApiRequestBody,
      UserContract.UserLoginApiResponseBody>(
      "/users/login",
      new UserContract.UserLoginApiRequestBody(loginName));

    if(responseStatus === 200) {
      setCookie("sessionId", responseBody.sessionId);
      router.push("/home");
    }
    else if(responseStatus === 401) {
			setPageError("Invalid user.");
		}
    else {
      setPageError(responseStatus + ": Unable to login user. Please try again.");
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Box sx={{textAlign: 'center'}}>
          <Typography variant="h2" sx={{ my: 8 }}>
            Welcome to RAiD Shopping Platform!
          </Typography>
        </Box>
        <Paper elevation={3} sx={{p: 8, mt: 8, width: '75%', minWidth: 300, maxWidth: 500}}>
          <Box sx={{ mt: 10 }}>
            <Box>
              <FormControl error={loginNameError !== ""} fullWidth>
                <InputLabel id="loginname-select-label">Select a login name</InputLabel>
                <Select
                  labelId="loginname-select-label"
                  value={loginName}
                  label="Select a login name"
                  onChange={loginNameSelectChange}>
                  <MenuItem value={"admin"}>admin</MenuItem>
                  <MenuItem value={"jenny"}>jenny</MenuItem>
                  <MenuItem value={"peter"}>peter</MenuItem>
                  <MenuItem value={"unknown"}>unknown</MenuItem>
                </Select>
                {loginNameError !== "" && <FormHelperText>{loginNameError}</FormHelperText>}
              </FormControl>
            </Box>
            <Box sx={{mt: 8}}>
              <Button variant="contained" onClick={loginButtonClick} fullWidth>
                LOGIN
              </Button>
            </Box>            
          </Box>
        </Paper>
      </Box>
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