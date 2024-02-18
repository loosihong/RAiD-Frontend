"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardMedia, Container, FormControl, FormHelperText, InputLabel, MenuItem, Pagination, Paper,
  Select, SelectChangeEvent, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { deDE } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';
import { useParams, useRouter } from "next/navigation";
import * as HttpUtil from "../../../../../utils/httpUtil";
import  "../../../../../utils/string.extension";
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
    console.log(event.target.value.length + ":" + event.target.value);

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
      new Date().toISOString(),
      new Date().toISOString(),
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

  const arrivedOnChange = (date: Date | null) => {
    let newProductBatch = {...productBatch};
    newProductBatch.arrivedOn = date?.toISOString() || new Date().toISOString();
    setProductBatch(newProductBatch);
  }

  const expiredDateChange = (date: Date | null) => {
    let newProductBatch = {...productBatch};
    newProductBatch.expiredDate = date?.toISOString() || new Date().toISOString();
    setProductBatch(newProductBatch);
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

  const addProductBatchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Save
    const [responseStatus, responseBody] = await HttpUtil.PostResponseBody<
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
        ));
        
    if(responseStatus === 200) {
      setPageSuccess("The batch is successfully added!");
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
    }
    else if(responseStatus === 401) {
      router.push("/");
    }
    else {
      setPageError(responseStatus + ": There is a problem updating the batch. Please reload the page and try again.");
    }
  }
  
  React.useEffect(() => {
    fetchProduct(sort, order, 1);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        { !isLoadingResult &&          
          <Box sx={{display: 'flex', flexWrap: 'wrap', width: '100%'}}>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, mt:8, width: '100%'}}>
              <Card sx={{ width: 400 }}>
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
                  <Box sx={{display: 'flex', gap: 4, minWidth: 300}}>
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
                <Typography variant="h5" sx={{flex: 1, minWidth: 200}}>
                  Product Batches
                </Typography>
                <Paper sx={{display: 'flex', flexDirection: 'column', gap: 4}}>
                  <TextField
                    variant="outlined"
                    label="Batch Number"
                    value={productBatch.batchNumber}
                    size="small"
                    onChange={batchNumberChange} />
                  <TextField
                    type="number"
                    variant="outlined"
                    label="Total Quantity"
                    value={productBatch.quantityTotal}
                    size="small"
                    onChange={quantityTotalChange} />
                  <TextField
                    type="number"
                    variant="outlined"
                    label="Quantity Left"
                    value={productBatch.quantityLeft}
                    size="small"
                    onChange={quantityLeftChange} />
                  {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Arrived On"
                      value={new Date(productBatch.arrivedOn)}
                      onChange={arrivedOnChange} />
                    <DatePicker
                      label="Expired On"
                      value={new Date(productBatch.expiredDate || new Date())}
                      onChange={expiredDateChange} />
                  </LocalizationProvider> */}
                  <Button variant="contained" onClick={addProductBatchButtonClick}>Add a Product Batch</Button>
                </Paper>
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
                          { productBatches.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.batchNumber}</TableCell>
                              <TableCell>{row.arrivedOn.slice(0, 10)}</TableCell>
                              <TableCell>{row.expiredDate?.slice(0, 10) || ""}</TableCell>
                              <TableCell align="right">{row.quantityTotal}</TableCell>
                              <TableCell align="right">{row.quantityLeft}</TableCell>
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