"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardMedia, Container, Paper, Snackbar, TextField,
  Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../utils/httpUtil";
import  "../../../utils/string.extension";
import * as CartItemContract from "../../../../backend/contract/customer/cartItem";
import * as PurchaseContract from "../../../../backend/contract/customer/purchase";
import * as CommonContract from "../../../../../backend/contract/common";

export default function CartItemsPage() {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [cartItems, setCartItems] = React.useState([] as CartItemContract.GetCartItemApiResponseBodyItem[]);
  const [oldQuantity, setOldQuantity] = React.useState(0);
  const [totalCost, setTotalCost] = React.useState(0);

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchCartItems = async () => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<CartItemContract.GetCartItemApiResponseBodyItem[]>(
      `/cart-items`);

    if(responseStatus === 200) {
      calculateAndSetTotalCost(responseBody);
      setCartItems(responseBody);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading cart. Please try again.");
    }
  }

  const calculateAndSetTotalCost = (items: CartItemContract.GetCartItemApiResponseBodyItem[]) => {
    let cost: number = 0;

      for(let item of items) {
        cost += (item.quantity * item.unitPrice);
      }

      setTotalCost(cost);
  }

  const productClick = async (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    router.push("/products/" + productId);
  }

  const quantityTextFieldFocus = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    setOldQuantity(cartItems[index].quantity);
  }

  const quantityTextFieldChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    let [quantityIsValid, quantityValue] = String.tryGetInteger(event.target.value);

    if(quantityIsValid) {
      // Set min and max value
      if(quantityValue < 1) {
        quantityValue = 1;
      }
      else if (quantityValue > cartItems[index].quantityAvailable) {
        quantityValue = cartItems[index].quantityAvailable;
      }

      // Set data
      let newCartItems: CartItemContract.GetCartItemApiResponseBodyItem[] = [...cartItems];
      newCartItems[index].quantity = quantityValue;
      calculateAndSetTotalCost(cartItems);
      setCartItems(newCartItems);
    }
  }

  const quantityTextFieldBlur = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    let [quantityIsValid, quantityValue] = String.tryGetInteger(event.target.value);

    if(quantityIsValid && oldQuantity > 0) {
      // Set min and max value
      if(quantityValue < 1) {
        quantityValue = 1;
      }
      else if (quantityValue > cartItems[index].quantityAvailable) {
        quantityValue = cartItems[index].quantityAvailable;
      }

      if(quantityValue !== oldQuantity) {
        // Save change
        const [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
          CartItemContract.SaveCartItemApiRequestBody,
          CommonContract.SaveRecordApiResponseBody>(
          "/cart-items",
          new CartItemContract.SaveCartItemApiRequestBody(
            cartItems[index].id,
            cartItems[index].productId,
            quantityValue,
            cartItems[index].versionNumber
        ));

        if(responseStatus === 200) {
          // Set data
          let newCartItems: CartItemContract.GetCartItemApiResponseBodyItem[] = [...cartItems];
          newCartItems[index].quantity = quantityValue;
          newCartItems[index].versionNumber = responseBody.versionNumber;
          calculateAndSetTotalCost(cartItems);
          setOldQuantity(0);
          setCartItems(newCartItems);
        }
        else if(responseStatus === 401) {
          router.push("/");
        }
        else {
          // Revert data
          let newCartItems: CartItemContract.GetCartItemApiResponseBodyItem[] = [...cartItems];
          setOldQuantity(newCartItems[index].quantity);
          newCartItems[index].quantity = oldQuantity;
          calculateAndSetTotalCost(cartItems);
          setCartItems(newCartItems);
          setOldQuantity(0);
          setPageError(responseStatus + ": Problem updating cart. Please try again.");
        }
      }
    }
  }

  const productRemoveButtonClick = async (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const responseStatus: number = await HttpUtil.DeleteResponseBody(`/cart-items/${cartItems[index].id}`);

    if(responseStatus === 200) {
      // Set data
      let newCartItems: CartItemContract.GetCartItemApiResponseBodyItem[] = [...cartItems];
      newCartItems.splice(index, 1);
      calculateAndSetTotalCost(cartItems);
      setCartItems(newCartItems);
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": Problem updating cart. Please try again.");
    }
  }

  const checkOutButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const cartItemIds: number[] = [];

    cartItems.forEach(item => cartItemIds.push(item.id));

    const [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
      PurchaseContract.CreatePurchaseApiRequestBody,
      CommonContract.SaveRecordApiResponseBody>(
      "/purchases",
      new PurchaseContract.CreatePurchaseApiRequestBody(
        cartItemIds
    ));

    if(responseStatus === 200) {
      // Set data
      router.push("/purchases");
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": Problem checking out cart. Please try again.");
    }
  }
  
  React.useEffect(() => {
    fetchCartItems();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Typography variant="h4">
          Cart
        </Typography>
        { !isLoadingResult && cartItems.length !== 0 &&
          <Box sx={{width: '100%'}}>
            { cartItems.map((item: CartItemContract.GetCartItemApiResponseBodyItem, index: number) => (
              <Paper
                variant="outlined"
                key={item.id}
                sx={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mt: 4, width: '100%'}}>
                <Card sx={{display: 'flex', alignItems: 'center', width: 200}}>
                  <CardActionArea onClick={(event) => productClick(event, item.productId)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
                  </CardActionArea>
                </Card>
                <Box sx={{display: 'flex', flexWrap: 'wrap', flex: 1, minWidth: 360}}>
                  <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4, justifyContent: 'space-evenly', p: 4}}>
                    <Typography variant="h6">
                      {item.productName}
                    </Typography>
                    <Typography variant="body1">
                      {item.storeName}
                    </Typography>
                    <Typography variant="body1">
                      {item.quantityAvailable} available
                    </Typography>
                    <Typography variant="body1">
                      ${item.unitPrice.toFixed(2)} {item.unitOfMeasureShortName !== "" ? "/" + item.unitOfMeasureShortName : ""}
                    </Typography>
                  </Box>
                  <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'space-evenly', p: 4, ml: 'auto'}}>
                    <Box sx={{width: 100}}>
                      <TextField
                        type="number"
                        variant="outlined"
                        label="Quantity"
                        value={item.quantity}
                        size="small"
                        onFocus={(event) => quantityTextFieldFocus(event, index)}
                        onChange={(event) => quantityTextFieldChange(event, index)}
                        onBlur={(event) => quantityTextFieldBlur(event, index)} />
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        Cost
                      </Typography>
                      <Typography variant="body1">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Button variant="contained" onClick={(event) => productRemoveButtonClick(event, index)}>Remove</Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
            <Box sx={{display: 'flex', justifyContent: 'right', alignItems: 'center', mt: 8, width: '100%'}}>
              <Typography variant="h5">
                Total Cost: ${totalCost.toFixed(2)}
              </Typography>
              <Box sx={{ml: 8}}>
                <Button variant="contained" size="large" onClick={checkOutButtonClick}>Check Out Cart</Button>
              </Box>
            </Box>
          </Box>
        }
        {!isLoadingResult && cartItems.length === 0 &&
          <Box sx={{mt: 8}}>
           <Typography variant="h5">
            Your cart is so empty!
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