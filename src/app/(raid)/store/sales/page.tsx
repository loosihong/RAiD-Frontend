"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardMedia, Container, Paper, Snackbar,
  Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../../utils/httpUtil";
import  "../../../../utils/string.extension";
import * as PurchaseContract from "../../../../../backend/contract/customer/purchase";

export default function StorePurchasesPage() {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [purchases, setPurchases] = React.useState([] as PurchaseContract.GetPurchaseApiReponseBodyItem[]);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const queryPageSize: number = 10;

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchPurchases = async (queryPageNumber: number) => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<
      PurchaseContract.GetPurchaseApiReponseBody>(
      `/stores/purchases?offset=${(queryPageNumber - 1) * queryPageSize}&fetch=${queryPageSize}`);

    if(responseStatus === 200) {
      setPageCount(Math.floor(responseBody.totalCount / queryPageSize + 1));
      setPurchases(responseBody.purchases);console.log(responseBody);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading store purchases. Please try again.");
    }
  }

  const productClick = async (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    router.push("/products/" + productId);
  }

  const confirmPurchaseButtonClick = async (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
      PurchaseContract.PutPurchaseApiRequestBody,
      PurchaseContract.PutPurchaseApiResponseBodyItem[]>(
      `/purchases/confirm`,
      new PurchaseContract.PutPurchaseApiRequestBody([purchases[index].id]));

    if(responseStatus === 200) {
      // Set data
      let newPurchases: PurchaseContract.GetPurchaseApiReponseBodyItem[] = [...purchases];
      newPurchases[index].purchaseStatusCode = responseBody[0].purchaseStatusCode;
      newPurchases[index].purchaseStatusName = responseBody[0].purchaseStatusName;
      newPurchases[index].versionNumber = responseBody[0].versionNumber;
      setPurchases(newPurchases);
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": Problem updating purchase. Please try again.");
    }
  }

  const sendPurchaseButtonClick = async (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
      PurchaseContract.PutPurchaseApiRequestBody,
      PurchaseContract.PutPurchaseApiResponseBodyItem[]>(
      `/purchases/send`,
      new PurchaseContract.PutPurchaseApiRequestBody([purchases[index].id]));

    if(responseStatus === 200) {
      // Set data
      let newPurchases: PurchaseContract.GetPurchaseApiReponseBodyItem[] = [...purchases];
      newPurchases[index].purchaseStatusCode = responseBody[0].purchaseStatusCode;
      newPurchases[index].purchaseStatusName = responseBody[0].purchaseStatusName;
      newPurchases[index].versionNumber = responseBody[0].versionNumber;
      setPurchases(newPurchases);
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": Problem updating purchase. Please try again.");
    }
  }

  const deliveredPurchaseButtonClick = async (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
      PurchaseContract.PutPurchaseApiRequestBody,
      PurchaseContract.PutPurchaseApiResponseBodyItem[]>(
      `/purchases/delivered`,
      new PurchaseContract.PutPurchaseApiRequestBody([purchases[index].id]));

    if(responseStatus === 200) {
      // Set data
      let newPurchases: PurchaseContract.GetPurchaseApiReponseBodyItem[] = [...purchases];
      newPurchases[index].purchaseStatusCode = responseBody[0].purchaseStatusCode;
      newPurchases[index].purchaseStatusName = responseBody[0].purchaseStatusName;
      newPurchases[index].versionNumber = responseBody[0].versionNumber;
      setPurchases(newPurchases);
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": Problem updating purchase. Please try again.");
    }
  }
  
  React.useEffect(() => {
    fetchPurchases(1);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        { !isLoadingResult && purchases.length !== 0 &&
          <Box sx={{width: '100%'}}>
            { purchases.map((purchase: PurchaseContract.GetPurchaseApiReponseBodyItem, purchaseIndex: number) => (
              <Paper
                variant="outlined"
                key={purchase.id}
                sx={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mt: 4, width: '100%'}}>
                <Box sx={{display: 'flex', alignItems: 'center', px: 4, pt: 4, width: '100%'}}>
                  <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4}}>
                    <Typography variant="body1">
                      Purchased on {purchase.purchasedOn.slice(0, 10)}
                    </Typography>
                    { purchase.deliveredOn === null &&
                      <Typography variant="body1">
                        Estimated delivery on {purchase.estimatedDeliveryDate.slice(0, 10)}
                      </Typography>
                    }
                    { purchase.deliveredOn !== null &&
                      <Typography variant="body1">
                        Delivered on {purchase.deliveredOn.slice(0, 10)}
                      </Typography>
                    }                  
                  </Box>
                  <Box sx={{display: 'flex', flexDirection: 'column', textAlign: 'right', gap: 4}}>
                    <Typography variant="body1">
                      Total Cost: ${purchase.totalPrice.toFixed(2)}
                    </Typography>
                    { purchase.purchaseStatusCode === "O" &&
                      <Button
                        variant="contained"
                        onClick={(event) => confirmPurchaseButtonClick(event, purchaseIndex)}>
                        Confirm
                      </Button>
                    }
                    { purchase.purchaseStatusCode === "OC" &&
                      <Button
                        variant="contained"
                        onClick={(event) => sendPurchaseButtonClick(event, purchaseIndex)}>
                        Send
                      </Button>
                    }
                    { purchase.purchaseStatusCode === "OD" &&
                      <Button
                        variant="contained"
                        onClick={(event) => deliveredPurchaseButtonClick(event, purchaseIndex)}>
                        Delivered
                      </Button>
                    }
                    { purchase.purchaseStatusCode !== "O" && purchase.purchaseStatusCode !== "OC" && purchase.purchaseStatusCode !== "OD" &&
                      <Typography variant="h6">
                        {purchase.purchaseStatusName}
                      </Typography>
                    }
                  </Box>
                </Box>
                { purchase.purchaseItems.map((purchaseItem: PurchaseContract.GetPurchaseItemApiReponseBodyItem, purchaseItemIndex) =>(
                  <Box key={purchaseItem.productId} sx={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', width: '100%'}}>
                    <Card sx={{display: 'flex', alignItems: 'center', width: 120}}>
                      <CardActionArea onClick={(event) => productClick(event, purchaseItem.productId)}>
                        <CardMedia
                          component="img"
                          height="120"
                          image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
                      </CardActionArea>
                    </Card>
                    <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 2, p: 4, minWidth: 360}}>
                        <Typography variant="body1">
                          {purchaseItem.productName}
                        </Typography>
                        <Box sx={{display: 'flex', gap: 2}}>
                          <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 2}}>
                            <Typography variant="body2">
                              ${purchaseItem.unitPrice.toFixed(2)} {purchaseItem.unitOfMeasureShortName !== "" ? "/" + purchaseItem.unitOfMeasureShortName : ""}
                            </Typography>
                            <Typography variant="body2">
                              Bought {purchaseItem.quantity} {purchaseItem.unitOfMeasureShortName}
                            </Typography>
                          </Box>
                          <Box sx={{display: 'flex', flex: 1}}>
                            <Typography variant="body2">
                              Cost: {(purchaseItem.quantity * purchaseItem.unitPrice).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                    </Box>
                  </Box>
                ))}                
              </Paper>
            ))}            
          </Box>
        }
        {!isLoadingResult && purchases.length === 0 &&
          <Box sx={{mt: 8}}>
           <Typography variant="h5">
            Your store do not have any purchases.
           </Typography>
          </Box>
        }
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