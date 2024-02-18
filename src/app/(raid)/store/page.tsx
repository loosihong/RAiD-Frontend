"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardMedia, Chip, Container, Pagination, Paper,
  Snackbar, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../utils/httpUtil";
import  "../../../utils/string.extension";
import * as ProductContract from "../../../../backend/contract/stock/product";

export default function StoreProductsPage() {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [products, setProducts] = React.useState([] as ProductContract.SearchStoreProductApiResponseBodyItem[]);
  const [keyword, setKeyword] = React.useState("");
  const [searchedKeyword, setSearchedQueryKeyword] = React.useState("");
  const [sort, setSort] = React.useState(ProductContract.SearchProductOrderBy.Relevance as string);
  const [order, setOrder] = React.useState(HttpUtil.QueryOrder.Desc as string);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const queryPageSize: number = 10;

  const pageErrorClose = () => {
    setPageError("");
  };

  const fetchProducts = async (
    queryKeyword: string,
    querySort: string,
    queryOrder:string,
    queryPageNumber: number) => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<
      ProductContract.SearchStoreProductApiResponseBody>(
        `/stores/products?keyword=${queryKeyword}&sort=${querySort}&order=${queryOrder}&offset=${(queryPageNumber - 1) * queryPageSize}&fetch=${queryPageSize}`);

    if(responseStatus === 200) {
      setPageCount(Math.floor(responseBody.totalCount / queryPageSize + 1));
      setProducts(responseBody.products);
      setIsLoadingResult(false);
    }
    else if(responseStatus === 401) {
			router.push("/");
		}
    else {
      setPageError(responseStatus + ": Problem loading products. Please try again.");
    }
  }

  const productClick = async (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    router.push("/store/products/" + productId);
  }

  const keywordTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  }

  const keywordTextFieldKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if(event.key === "Enter") {
      setSearchedQueryKeyword(keyword);
      setPageNumber(1);
      fetchProducts(keyword, sort, order, 1);
    }
  }

  const searchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setSearchedQueryKeyword(keyword);
    setPageNumber(1);
    fetchProducts(keyword, sort, order, 1);
  }

  const createButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    router.push("/store/products/0");
  }

  const sortChipClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, buttonText: string) => {
    setSort(buttonText);
    setPageNumber(1);
    fetchProducts(searchedKeyword, buttonText, order, 1);
  };

  const orderChipClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, buttonText: string) => {
    setOrder(buttonText);
    setPageNumber(1);
    fetchProducts(searchedKeyword, sort, buttonText, 1);
  };

  const paginationChange = async (event: React.ChangeEvent, paginationPage: number) => {
    setPageNumber(paginationPage);
    fetchProducts(searchedKeyword, sort, order, paginationPage);
  }
  
  React.useEffect(() => {
    fetchProducts(searchedKeyword, sort, order, 1);
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
          <Box sx={{display: 'flex', pl: 4}}>
            <Button variant="outlined" onClick={createButtonClick}>Create</Button>
          </Box>
        </Box>
        <Box sx={{display: 'flex', flexWrap: 'wrap', width: '100%'}}>          
          <Box sx={{display: 'flex', gap: 2, alignItems: 'center', mr: 6, mt: 3}}>
            <Typography variant="body1">
              Sort By
            </Typography>
            <Chip 
              color="primary"
              variant={sort === ProductContract.SearchProductOrderBy.Relevance? "filled" : "outlined"}
              label="Relevance"
              onClick={(event) => sortChipClick(event, ProductContract.SearchProductOrderBy.Relevance)} />
            <Chip
              color="primary"
              variant={sort === ProductContract.SearchProductOrderBy.Price? "filled" : "outlined"}
              label="Price"
              onClick={(event) => sortChipClick(event, ProductContract.SearchProductOrderBy.Price)} />
            <Chip
              color="primary"
              variant={sort === ProductContract.SearchProductOrderBy.Sales? "filled" : "outlined"}
              label="Sales"
              onClick={(event) => sortChipClick(event, ProductContract.SearchProductOrderBy.Sales)} />
          </Box>
          <Box sx={{display: 'flex', gap: 2, alignItems: 'center', mr: 6, mt: 3}}>
            <Typography variant="body1" sx={{textWrap: 'nowrap'}}>
              Order By
            </Typography>
            <Chip 
              color="primary"
              variant={order === HttpUtil.QueryOrder.Desc ? "filled" : "outlined"}
              label="Desc"
              onClick={(event) => orderChipClick(event, HttpUtil.QueryOrder.Desc)} />
            <Chip
              color="primary"
              variant={order === HttpUtil.QueryOrder.Asc ? "filled" : "outlined"}
              label="Asc"
              onClick={(event) => orderChipClick(event, HttpUtil.QueryOrder.Asc)} />
          </Box>
        </Box>
        { !isLoadingResult && products.length !== 0 &&
          <Box sx={{width: '100%'}}>
            { products.map((item: ProductContract.SearchStoreProductApiResponseBodyItem, index: number) => (
              <Paper
                variant="outlined"
                key={item.id}
                sx={{display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', mt: 4, width: '100%'}}>
                <Card sx={{display: 'flex', alignItems: 'center', width: 120}}>
                  <CardActionArea onClick={(event) => productClick(event, item.id)}>
                    <CardMedia
                      component="img"
                      height="120"
                      image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
                  </CardActionArea>
                </Card>
                <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 2, p: 4, minWidth: 360}}>
                  <Typography variant="body1">
                    {item.name}
                  </Typography>
                  <Box sx={{display: 'flex', gap: 2}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', flex: 1, gap: 2}}>
                      <Typography variant="body2">
                        {item.quantityAvailable} Available
                      </Typography>
                      <Typography variant="body2">
                        {item.quantitySold} Sold
                      </Typography>
                    </Box>
                    <Box sx={{display: 'flex', flex: 1}}>
                      <Typography variant="body2">
                        ${item.unitPrice.toFixed(2)} {item.unitOfMeasureShortName !== "" ? "/" + item.unitOfMeasureShortName : ""}
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
        {!isLoadingResult && products.length === 0 && keyword.trim() === "" &&
          <Box sx={{mt: 8}}>
           <Typography variant="h5">
            Your store do not have any products.
           </Typography>
          </Box>
        }
        {!isLoadingResult && products.length === 0 && keyword.trim() !== "" &&
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