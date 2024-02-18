"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardMedia, Container, Snackbar, TextField, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as HttpUtil from "../../../../utils/httpUtil";
import  "../../../../utils/string.extension";
import * as ProductContract from "../../../../../backend/contract/stock/product";
import * as CartItemContract from "../../../../../backend/contract/customer/cartItem";
import * as CommonContract from "../../../../../backend/contract/common";

export default function ProductPage() {
  const [pageSuccess, setPageSuccess] = React.useState("");
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [keyword, setKeyword] = React.useState("");
  const [product, setProduct] = React.useState({} as ProductContract.GetProductApiResponseBody);
  const [cartQuantity, setCartQuantity] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  const pageSuccessClose = () => {
    setPageSuccess("");
  };

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchProduct = async () => {
    // Validate params
    const [idIsValid, idValue] = String.tryGetInteger(params.id);

    if(!idIsValid || idValue < 1) {
      setPageError("There is no such product.");
      return;
    }

    // Load product
    const [[responseStatus, responseBody], [quantityResponseStatus, quantityResponseBody]] = await Promise.all(
      [HttpUtil.GetResponseBody<ProductContract.GetProductApiResponseBody>(
        `/products/${idValue}`),
      HttpUtil.GetResponseBody<CartItemContract.GetCartItemQuantityApiResponseBody>(
        `/cart-items/products/${idValue}/quantity`)]
    );

    if(responseStatus === 200 && quantityResponseStatus == 200) {
      setProduct(responseBody);
      setCartQuantity(quantityResponseBody.quantity);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading product. Please try again.");
    }
  }
  
  const searchProducts = async () => {
    router.push("/home?keyword=" + keyword.trim());
  }

  const keywordTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  }

  const keywordTextFieldKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if(event.key === "Enter") {
      searchProducts();
    }
  }

  const searchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    searchProducts();
  }

  const quantityTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let [quantityIsValid, quantityValue] = String.tryGetInteger(event.target.value);
    
    if(quantityIsValid) {
      // Set min and max value
      if(quantityValue < 1) {
        quantityValue = 1;
      }
      else if ((quantityValue + cartQuantity) > product.quantityAvailable) {
        quantityValue = product.quantityAvailable - cartQuantity;
      }

      setQuantity(quantityValue);
    }
  }

  const cartButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Validate
    if((cartQuantity + quantity) > product.quantityAvailable) {
      setPageError("Unable to add more quantity than available to cart.");
      return;
    }

    const [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
      CartItemContract.SaveCartItemApiRequestBody,
      CommonContract.SaveRecordApiResponseBody>(
      "/cart-items",
      new CartItemContract.SaveCartItemApiRequestBody(
        0,
        product.id,
        quantity,
        0
      ));

    if(responseStatus === 200) {
      setCartQuantity(quantity);
      setQuantity(1);      
      setPageSuccess("The product is successfully added to your cart!");
    }
    else {
      setPageError(responseStatus + ": There is a problem adding the product to your cart. Please reload the page and try again.");
    }
  }
  
  React.useEffect(() => {
    fetchProduct();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Box sx={{display: 'flex', width: '100%'}}>
          <Box sx={{flex: 1}}>
            <TextField
              label="Search for another product"
              variant="outlined"
              value={keyword}
              fullWidth
              onChange={keywordTextFieldChange}
              onKeyDown={keywordTextFieldKeyDown} />
          </Box>
          <Box sx={{display: 'flex', pl: 4}}>
            <Button variant="contained" onClick={searchButtonClick}>Search</Button>
          </Box>
        </Box>
        { !isLoadingResult &&          
          <Box sx={{display: 'flex', flexWrap: 'wrap', width: '100%'}}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, mt:8, width: '100%'}}>
              <Card sx={{ width: 400 }}>
                <CardMedia
                  component="img"
                  height="400"
                  image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
              </Card>
              <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, minWidth: 360}}>
                <Typography variant="h4">
                  {product.name}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'flex-end', mt:8}}>
                  <Typography variant="h5">
                    ${product.unitPrice.toFixed(2)}
                  </Typography>
                  { product.unitOfMeasureShortName !== "" &&
                    <Typography variant="h6" sx={{ml: 4}}>
                      /{product.unitOfMeasureShortName}
                    </Typography>
                  }
                </Box>                    
                <Typography variant="body1" sx={{mt:8}}>
                  <b>Store:</b> {product.storeName}
                </Typography>                
                <Typography variant="body1" sx={{mt:4}}>
                  <b>Quantity Sold:</b> {product.quantitySold} {product.unitOfMeasureShortName}
                </Typography>
                <Typography variant="body1" sx={{mt:4}}>
                  <b>Quantity Available:</b> {product.quantityAvailable}  {product.unitOfMeasureShortName}
                </Typography>
                <Typography variant="body1" sx={{mt:4}}>
                  <b>Quantity in Cart:</b> {cartQuantity}  {product.unitOfMeasureShortName}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', mt: 8}}>
                  <Typography variant="body1">
                    <b>BUY</b>
                  </Typography>
                  <Box sx={{ml: 4, width: 100}}>
                    <TextField
                      type="number"
                      variant="outlined"
                      value={quantity}
                      onChange={quantityTextFieldChange} />
                  </Box>
                  { product.unitOfMeasureShortName !== "" &&
                    <Typography variant="body1" sx={{ml: 4}}>
                      {product.unitOfMeasureShortName}
                    </Typography>
                  }
                  <Box sx={{ml: 12}}>
                    <Button variant="contained" size="large" onClick={cartButtonClick}>Add to Cart</Button>
                  </Box>
                </Box>                
              </Box>
            </Box>        
            <Box sx={{mt: 8, minWidth: 400}}>
              <Typography variant="body2">
                {product.description}
              </Typography>
            </Box>
          </Box>
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