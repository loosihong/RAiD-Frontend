"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardMedia, Container, Pagination, Paper, Snackbar, TextField,
  Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../../utils/httpUtil";
import  "../../../../utils/string.extension";
import * as PurchaseItemContract from "../../../../../backend/contract/customer/purchaseItem";

export default function PurchasesActivePage() {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [purchaseItems, setPurchaseItems] = React.useState([] as PurchaseItemContract.SearchPurchaseItemApiResponseBodyItem[]);
  const [keyword, setKeyword] = React.useState("");
  const [searchedKeyword, setSearchedQueryKeyword] = React.useState("");
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const queryPageSize: number = 10;

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchPurchases = async (
    queryKeyword: string,
    queryPageNumber: number) => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<
      PurchaseItemContract.SearchPurchaseItemApiResponseBody>(
      `/users/purchase-items/history?keyword=${queryKeyword}&offset=${(queryPageNumber - 1) * queryPageSize}&fetch=${queryPageSize}`);

    if(responseStatus === 200) {
      setPageCount(Math.floor(responseBody.totalCount / queryPageSize + 1));
      setPurchaseItems(responseBody.purchaseItems);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading purchase history. Please try again.");
    }
  }

  const productClick = async (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    router.push("/products/" + productId);
  }

  const keywordTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  }

  const keywordTextFieldKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if(event.key === "Enter") {
      setSearchedQueryKeyword(keyword);
      setPageNumber(1);
      fetchPurchases(keyword, 1);
    }
  }

  const searchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setSearchedQueryKeyword(keyword);
    setPageNumber(1);
    fetchPurchases(keyword, 1);
  }

  const paginationChange = async (event: React.ChangeEvent, paginationPage: number) => {
    setPageNumber(paginationPage);
    fetchPurchases(searchedKeyword, paginationPage);
  }
  
  React.useEffect(() => {
    fetchPurchases(searchedKeyword, 1);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Box sx={{display: 'flex', width: '100%'}}>
          <Box sx={{flex: 1}}>
            <TextField
              label="Search for a purchase"
              variant="outlined"
              value={keyword}
              size="small"
              fullWidth
              onChange={keywordTextFieldChange}
              onKeyDown={keywordTextFieldKeyDown} />
          </Box>
          <Box sx={{display: 'flex', pl: 4}}>
            <Button variant="contained" onClick={searchButtonClick}>Search</Button>
          </Box>
        </Box>
        { !isLoadingResult && purchaseItems.length !== 0 &&
          <Box sx={{width: '100%'}}>
            { purchaseItems.map((item: PurchaseItemContract.SearchPurchaseItemApiResponseBodyItem, index: number) => (
              <Paper
                variant="outlined"
                key={item.id}
                sx={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mt: 4, width: '100%'}}>
                <Card sx={{display: 'flex', alignItems: 'center', width: 160}}>
                  <CardActionArea onClick={(event) => productClick(event, item.productId)}>
                    <CardMedia
                      component="img"
                      height="160"
                      image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
                  </CardActionArea>
                </Card>
                <Box sx={{display: 'flex', flexDirection: 'column', flex:1, gap: 2, p: 4, minWidth: 360}}>
                  <Typography variant="body1">
                    {item.productName}
                  </Typography>
                  <Box sx={{display: 'flex'}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'space-evenly'}}>                    
                      <Typography variant="body2">
                        {item.storeName}
                      </Typography>                    
                      <Typography variant="body2">
                        ${item.unitPrice.toFixed(2)} {item.unitOfMeasureShortName !== "" ? "/" + item.unitOfMeasureShortName : ""}
                      </Typography>
                      <Typography variant="body2">
                        Bought {item.quantity} {item.unitOfMeasureShortName}
                      </Typography>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'space-evenly', p: 4,}}>
                      <Typography variant="body2">
                        Purchased on {item.purchasedOn.slice(0, 10)}
                      </Typography>
                      {item.deliveredOn !== null &&
                        <Typography variant="body2">
                          Delivered on {item.deliveredOn.slice(0, 10)}
                        </Typography>
                      }
                      <Typography variant="body2">
                        Cost: ${(item.quantity * item.unitPrice).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
            <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
              <Pagination
                count={pageCount}                
                variant="outlined"
                color="primary"
                page={pageNumber}
                onChange={(event, value) => paginationChange(event as React.ChangeEvent, value)} />
            </Box>
          </Box>
        }
        {!isLoadingResult && purchaseItems.length === 0 && keyword.trim() === "" &&
          <Box sx={{mt: 8}}>
           <Typography variant="h5">
            You do not have any purchases.
           </Typography>
          </Box>
        }
        {!isLoadingResult && purchaseItems.length === 0 && keyword.trim() !== "" &&
          <Box sx={{mt: 8}}>
           <Typography variant="h5">
           No product found for &quot;{searchedKeyword}&quot;.
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