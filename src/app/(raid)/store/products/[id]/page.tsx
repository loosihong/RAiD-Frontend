"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardMedia, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl,
  FormHelperText, InputLabel, MenuItem, Pagination, Paper, Select, SelectChangeEvent, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as HttpUtil from "../../../../../utils/httpUtil";
import  "../../../../../utils/string.extension";
import  "../../../../../utils/date.extension";
import * as ProductContract from "../../../../../../backend/contract/stock/product";
import * as ProductBatchContract from "../../../../../../backend/contract/stock/productBatch";
import * as CommonContract from "../../../../../../backend/contract/common";

export default function StoreProductPage() {
  const [pageSuccess, setPageSuccess] = React.useState("");
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [product, setProduct] = React.useState({} as ProductContract.GetStoreProductApiResponseBody);
  const [productBatches, setProductBatches] = React.useState({} as ProductBatchContract.GetProductBatchApiResponseBodyItem[]);
  const [nameError, setNameError] = React.useState("");
  const [unitPriceText, setUnitPriceText] = React.useState("");
  const [unitPriceError, setUnitPriceError] = React.useState("");
  const [unitOfMeasures, setUnitOfMeasures] = React.useState([] as CommonContract.SelectionApiResponseBodyItem[]);
  const [unitOfMeasureError, setUnitOfMeasureError] = React.useState("");
  const [unitOfMeasureShortName, setUnitOfMeasureShortName] = React.useState("");
  const [productBatch, setProductBatch] = React.useState({} as ProductBatchContract.GetProductBatchApiResponseBodyItem);
  const [sort, setSort] = React.useState(ProductBatchContract.GetProductBatchOrderBy.ExpiredOn as string);
  const [order, setOrder] = React.useState(HttpUtil.QueryOrder.Desc as string);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const queryPageSize: number = 10;
  const [openProductBatchDialog, setOpenProductBatchDialog] = React.useState(false);
  const theme = useTheme();
  const productBatchDialogFullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const pageSuccessClose = () => {
    setPageSuccess("");
  };

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchProduct = async (
    querySort: string,
    queryOrder:string,
    queryPageNumber: number) => {
    // Validate params
    const [idIsValid, idValue] = String.tryGetInteger(params.id);

    if(!idIsValid || idValue < 0) {
      setPageError("There is no such product.");
      return;
    }

    if(idValue > 0) {
      // Load product
      const [[responseStatus, responseBody],
        [productBatchesResponseStatus, productBatchesResponseBody],
        [unitOfMeasureResponseStatus, unitOfMeasureResponseBody]] = await Promise.all(
        [HttpUtil.GetResponseBody<ProductContract.GetStoreProductApiResponseBody>(
          `/stores/products/${idValue}`),
        HttpUtil.GetResponseBody<ProductBatchContract.GetProductBatchApiResponseBody>(
          `/products/${idValue}/product-batches?sort=${querySort}&order=${queryOrder}&offset=${(queryPageNumber - 1) * queryPageSize}&fetch=${queryPageSize}`),
        HttpUtil.GetResponseBody<CommonContract.SelectionApiResponseBodyItem[]>(
          `/unit-measures/selection`)]
      );

      if(responseStatus === 200 && productBatchesResponseStatus == 200 && unitOfMeasureResponseStatus === 200) {
        setProduct(responseBody);
        setUnitPriceText(responseBody.unitPrice.toFixed(2));
        setUnitOfMeasures(unitOfMeasureResponseBody);
        setUnitOfMeasureShortName(unitOfMeasureResponseBody.find(i => i.id === responseBody.unitOfMeasureId)?.shortName || "");
        setPageCount(Math.floor(productBatchesResponseBody.totalCount / queryPageSize + 1));
        setProductBatches(productBatchesResponseBody.productBatches);
        initializeNewProductBatch(responseBody.id);
        setIsLoadingResult(false);
      }
      else if(responseStatus === 401) {
        router.push("/");
      }
      else {
        setPageError(responseStatus + ": Problem loading product. Please try again.");
      }
    }
    else {
      // Load unit of measures
      const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<CommonContract.SelectionApiResponseBodyItem[]>(
          `/unit-measures/selection`);

      if(responseStatus === 200) {
        setProduct(new ProductContract.GetStoreProductApiResponseBody(
          0,
          "",
          "",
          "",
          0,
          0,
          0,
          0,
          0
        ));

        setUnitPriceText("0.00");
        setUnitOfMeasures(responseBody);
        setIsLoadingResult(false);
      }
      else if(responseStatus === 401) {
        router.push("/");
      }
      else {
        setPageError(responseStatus + ": Problem loading unit of measures. Please try again.");
      }
    }
  }

  const nameChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if(event.target.value.length <= 200) {
      let newProduct: ProductContract.GetStoreProductApiResponseBody = {...product};
      newProduct.name = event.target.value;
      setProduct(newProduct);
    }

    setNameError(product.name.length === 0 ? "This is required.": "");    
  }

  const skuCodeChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if(event.target.value.length <= 50) {
      let newProduct: ProductContract.GetStoreProductApiResponseBody = {...product};
      newProduct.skuCode = event.target.value;
      setProduct(newProduct);
    }
  }

  const unitPriceChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUnitPriceText(event.target.value);
  }

  const unitPriceBlur = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const [unitPriceIsValid, unitPriceValue] = String.tryGetNumber(event.target.value);

    if(unitPriceIsValid && unitPriceValue >= 0 && unitPriceValue <= 999999999999999.99) {
      let newProduct: ProductContract.GetStoreProductApiResponseBody = {...product};
      newProduct.unitPrice = unitPriceValue;
      setProduct(newProduct);
      setUnitPriceText(newProduct.unitPrice.toFixed(2));
    }

    setUnitPriceError(!unitPriceIsValid ? "Value is invalid." : "");
  }

  const descriptionChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if(event.target.value.length <= 5000) {
      let newProduct: ProductContract.GetStoreProductApiResponseBody = {...product};
      newProduct.description = event.target.value;
      setProduct(newProduct);
    }
  }

  const unitOfMeasureChange = (event: SelectChangeEvent) => {
    let newProduct: ProductContract.GetStoreProductApiResponseBody = {...product};
    newProduct.unitOfMeasureId = Number(event.target.value);
    setProduct(newProduct);
    setUnitOfMeasureShortName(unitOfMeasures.find(i => i.id === product.unitOfMeasureId)?.shortName || "");
    setUnitOfMeasureError(event.target.value === "" ? "This is required!" : "");
  };

  const saveButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Validate
    setNameError(product.name.length === 0 ? "This is required.": "");
    setUnitOfMeasureError(product.unitOfMeasureId === 0 ? "This is required!" : "");
    const [unitPriceIsValid, unitPriceValue] = String.tryGetNumber(unitPriceText);

    if(!unitPriceIsValid || unitPriceValue < 0 || unitPriceValue > 999999999999999.99) {
      setUnitPriceError(!unitPriceIsValid ? "Value is invalid." : "");
    }

    if(product.name.length === 0 || product.unitOfMeasureId === 0 || !unitPriceIsValid) {
      setPageError("Please correct the errors before saving.");
      return;
    }

    // Save
    let responseStatus: number;
    let responseBody: CommonContract.SaveRecordApiResponseBody;
    
    if(product.id === 0) {
      [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
        ProductContract.SaveProductApiRequestBody,
        CommonContract.SaveRecordApiResponseBody>(
        `/products`,
        new ProductContract.SaveProductApiRequestBody(
          product.id,
          product.name,
          product.skuCode,
          product.description,
          product.unitOfMeasureId,
          product.unitPrice,
          product.versionNumber
        ));
    }
    else {
      [responseStatus, responseBody] = await HttpUtil.PutResponseBody<
        ProductContract.SaveProductApiRequestBody,
        CommonContract.SaveRecordApiResponseBody>(
        `/products`,
        new ProductContract.SaveProductApiRequestBody(
          product.id,
          product.name,
          product.skuCode,
          product.description,
          product.unitOfMeasureId,
          product.unitPrice,
          product.versionNumber
        ));
    }

    if(responseStatus === 200) {
      setPageSuccess("The product is successfully updated!");
      setIsLoadingResult(true);

      if(product.id === 0) {
        router.push("/store/products/" + responseBody.id);
      }
      else {
        await fetchProduct(sort, order, 1);
      }
    }
    else {
      setPageError(responseStatus + ": There is a problem updating your product. Please reload the page and try again.");
    }
  }

  const deleteButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const responseStatus: number = await HttpUtil.DeleteResponseBody(`/products/${product.id}`);

    if(responseStatus === 200) {
      router.push("/store");
    }
    else {
      setPageError(responseStatus + ": There is a problem deketing your product. Please reload the page and try again.");
    }
  }

  const backButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    router.push("/store");
  }

  const paginationChange = async (event: React.ChangeEvent, paginationPage: number) => {
    setPageNumber(paginationPage);
    fetchProduct(sort, order, paginationPage);
  }

  const initializeNewProductBatch = (productId: number) => {
    setProductBatch(new ProductBatchContract.GetProductBatchApiResponseBodyItem(
      0,
      productId,
      "",
      0,
      0,
      new Date().toStringInDate(),
      new Date().toStringInDate(),
      0
    ));
  }

  const batchNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if(event.target.value.length <= 100) {
      let newProductBatch = {...productBatch};
      newProductBatch.batchNumber = event.target.value;
      setProductBatch(newProductBatch);
    }
  }

  const arrivedOnChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const [arrivedOnIsValid, arrivedOnValue] = String.tryGetDate(event.target.value);

    if(arrivedOnIsValid) {
      let newProductBatch = {...productBatch};
      newProductBatch.arrivedOn = arrivedOnValue.toStringInDate();
      setProductBatch(newProductBatch);
    }
  }

  const expiredDateChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const [expiredDateIsValid, expiredDateValue] = String.tryGetDate(event.target.value);

    if(expiredDateIsValid) {
      let newProductBatch = {...productBatch};
      newProductBatch.expiredDate = expiredDateValue.toStringInDate();
      setProductBatch(newProductBatch);
    }
  }

  const quantityTotalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [quantityIsValid, quantityValue] = String.tryGetInteger(event.target.value);

    if(quantityIsValid && quantityValue > 0 && quantityValue > productBatch.quantityLeft) {
      let newProductBatch = {...productBatch};
      newProductBatch.quantityTotal = quantityValue;
      setProductBatch(newProductBatch);
    }
  }

  const quantityLeftChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [quantityIsValid, quantityValue] = String.tryGetInteger(event.target.value);

    if(quantityIsValid && quantityValue >= 0 && quantityValue <= productBatch.quantityTotal) {
      let newProductBatch = {...productBatch};
      newProductBatch.quantityLeft = quantityValue;
      setProductBatch(newProductBatch);
    }
  }

  const saveProductBatchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Save
    const [responseStatus, responseBody] = (product.id === 0 ?
      await HttpUtil.PostResponseBody<
        ProductBatchContract.SaveProductBatchApiRequestBody,
        CommonContract.SaveRecordApiResponseBody>(
        `/products/product-batches`,
        new ProductBatchContract.SaveProductBatchApiRequestBody(
          productBatch.id,
          productBatch.productId,
          productBatch.batchNumber,
          productBatch.quantityTotal,
          productBatch.quantityLeft,
          productBatch.arrivedOn,
          productBatch.expiredDate,
          0
      )) :
      await HttpUtil.PutResponseBody<
        ProductBatchContract.SaveProductBatchApiRequestBody,
        CommonContract.SaveRecordApiResponseBody>(
        `/products/product-batches`,
        new ProductBatchContract.SaveProductBatchApiRequestBody(
          productBatch.id,
          productBatch.productId,
          productBatch.batchNumber,
          productBatch.quantityTotal,
          productBatch.quantityLeft,
          productBatch.arrivedOn,
          productBatch.expiredDate,
          productBatch.versionNumber
      ))
    );
        
    if(responseStatus === 200) {
      setPageSuccess("The batch is successfully saved!");
      const [productBatchesResponseStatus, productBatchesResponseBody] = await HttpUtil.GetResponseBody<
        ProductBatchContract.GetProductBatchApiResponseBody>(
        `/products/${product.id}/product-batches?sort=${sort}&order=${order}&offset=0&fetch=${queryPageSize}`);
      
      if(productBatchesResponseStatus == 200) {
        setPageCount(Math.floor(productBatchesResponseBody.totalCount / queryPageSize + 1));
        setProductBatches(productBatchesResponseBody.productBatches);
        initializeNewProductBatch(product.id);
      }
      else if(productBatchesResponseStatus === 401) {
        router.push("/");
      }
      else {
        setPageError(responseStatus + ": Problem loading product batches. Please try again.");
      }

      setOpenProductBatchDialog(false);
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": There is a problem updating the batch. Please reload the page and try again.");
    }
  }

  const productBatchDialogOpen = (index: number) => {
    if(index >= 0 && index < productBatches.length) {
      const curProductBatch = {...productBatches[index]}
      curProductBatch.arrivedOn = curProductBatch.arrivedOn.slice(0, 10);
      curProductBatch.expiredDate = curProductBatch.expiredDate?.slice(0, 10) || "";
      setProductBatch(curProductBatch);
    }
    else {
      initializeNewProductBatch(product.id);
    }

    setOpenProductBatchDialog(true);
  };

  const productBatchDialogClose = () => {
    initializeNewProductBatch(product.id);
    setOpenProductBatchDialog(false);
  };
  
  React.useEffect(() => {
    fetchProduct(sort, order, 1);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        { !isLoadingResult &&          
          <Box sx={{display: 'flex', flexWrap: 'wrap', width: '100%'}}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, mt:8, width: '100%'}}>
              <Card sx={{display: 'flex', alignItems: 'center', width: 400 }}>
                <CardMedia
                  component="img"
                  height="400"
                  image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
              </Card>
              <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4, minWidth: 360}}>
                <Box sx={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, mb: 4}}>                
                  <Typography variant="h4" sx={{flex: 1, minWidth: 200}}>
                    {product.id === 0 ? "New Product": "Edit Product"}
                  </Typography>
                  <Box sx={{display: 'flex', gap: 4, justifyContent: 'right', minWidth: 300}}>
                    <Button variant="outlined" onClick={backButtonClick}>Back</Button>
                    { product.id !== 0 &&
                      <Button variant="outlined" onClick={deleteButtonClick}>Delete</Button>
                    }
                    <Button variant="contained" onClick={saveButtonClick}>Save</Button>
                  </Box>
                </Box>
                <TextField
                  variant="outlined"
                  label="Name"
                  value={product.name}
                  size="small"
                  error={nameError !== ""}
                  helperText={nameError}
                  onChange={nameChange} />
                <TextField
                  variant="outlined"
                  label="SKU Code"
                  value={product.skuCode}
                  size="small"
                  onChange={skuCodeChange} />
                <TextField
                  variant="outlined"
                  label="Unit Price"
                  value={unitPriceText}
                  size="small"
                  error={unitPriceError !== ""}
                  helperText={unitPriceError}
                  onChange={unitPriceChange}
                  onBlur={unitPriceBlur} />
                <FormControl error={unitOfMeasureError !== ""} fullWidth>
                  <InputLabel id="unitofmeasure-select-label">Unit of Measure</InputLabel>
                  <Select
                    labelId="unitofmeasure-select-label"
                    value={product.unitOfMeasureId?.toString() || ""}
                    label="Unit of Measure"
                    size="small"
                    onChange={unitOfMeasureChange}>
                    { unitOfMeasures.map((item:  CommonContract.SelectionApiResponseBodyItem, index: number) => (
                      <MenuItem value={item.id} key={item.id}>{item.name}</MenuItem>
                    ))}
                  </Select>
                  {unitOfMeasureError !== "" && <FormHelperText>{unitOfMeasureError}</FormHelperText>}
                </FormControl>
                <Typography variant="body1" sx={{mt: 4}}>
                  <b>Quantity Sold:</b> {product.quantitySold} {unitOfMeasureShortName}
                </Typography>
                <Typography variant="body1">
                  <b>Quantity Available:</b> {product.quantityAvailable}  {unitOfMeasureShortName}
                </Typography>                       
              </Box>
            </Box>        
            <Box sx={{mt: 8, minWidth: 400, width: '100%'}}>
              <TextField
                label="Description"
                multiline
                rows={5}
                value={product.description}
                onChange={descriptionChange} fullWidth />
            </Box>
            { product.id !== 0 &&
              <Box sx={{display: 'flex', flexDirection: 'column', gap: 4, mt: 8, minWidth: 400, width: '100%'}}>
                <Box sx={{display: 'flex'}}>
                  <Typography variant="h5" sx={{flex: 1, minWidth: 200}}>
                    Product Batches
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{width: 'fit-content'}}
                    onClick={() => productBatchDialogOpen(-1)}>
                    Add a Product Batch
                  </Button>
                </Box>
                <Dialog
                  fullScreen={productBatchDialogFullScreen}
                  open={openProductBatchDialog}
                  sx={{minWidth: 400}}
                  onClose={productBatchDialogClose}>
                  <DialogTitle>
                    {productBatch.id === 0 ? "New Product Batch" : "Edit Product Batch"}
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 4, mt: 4}}>
                      <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4}}>
                        <TextField
                          variant="outlined"
                          label="Batch Number"
                          value={productBatch.batchNumber}
                          size="small"
                          onChange={batchNumberChange} />
                        <TextField
                          type="date"
                          variant="outlined"
                          label="Arrived On"
                          value={productBatch.arrivedOn}
                          sx={{width: 240}}
                          size="small"
                          onChange={arrivedOnChange} />
                        <TextField
                          type="date"
                          variant="outlined"
                          label="Expired On"
                          value={productBatch.expiredDate}
                          sx={{width: 240}}
                          size="small"
                          onChange={expiredDateChange} />                      
                      </Box>
                      <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 4}}>
                        <TextField
                          type="number"
                          variant="outlined"
                          label="Total Quantity"
                          value={productBatch.quantityTotal}
                          size="small"
                          sx={{width: 240}}
                          onChange={quantityTotalChange} />
                        <TextField
                          type="number"
                          variant="outlined"
                          label="Quantity Left"
                          value={productBatch.quantityLeft}
                          size="small"
                          sx={{width: 240}}
                          onChange={quantityLeftChange} />
                      </Box>
                    </Box>  
                  </DialogContent>
                  <DialogActions>
                    <Button
                      variant="outlined"
                      onClick={productBatchDialogClose}>
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      onClick={saveProductBatchButtonClick}>
                      {productBatch.id === 0 ? "Add" : "Update"}
                    </Button>
                  </DialogActions>
                </Dialog>
                { !isLoadingResult && productBatches.length > 0 &&
                  <Box>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Batch Number</TableCell>
                            <TableCell>Arrived On</TableCell>
                            <TableCell>Expired On</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">Left</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          { productBatches.map((row, index) => (
                            <TableRow key={row.id}>
                              <TableCell onClick={() => productBatchDialogOpen(index)}>{row.batchNumber}</TableCell>
                              <TableCell onClick={() => productBatchDialogOpen(index)}>{row.arrivedOn.slice(0, 10)}</TableCell>
                              <TableCell onClick={() => productBatchDialogOpen(index)}>{row.expiredDate?.slice(0, 10) || ""}</TableCell>
                              <TableCell align="right" onClick={() => productBatchDialogOpen(index)}>{row.quantityTotal}</TableCell>
                              <TableCell align="right" onClick={() => productBatchDialogOpen(index)}>{row.quantityLeft}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
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
                { !isLoadingResult && productBatches.length === 0 &&
                  <Box sx={{mt: 8}}>
                  <Typography variant="h5">
                    You do not have any batches.
                  </Typography>
                  </Box>
                }
              </Box>
            }
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