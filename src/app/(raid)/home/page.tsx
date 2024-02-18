"use client";

import * as React from 'react';
import { Alert, Box, Button, Card, CardActionArea, CardContent, CardMedia, Chip, Container, Grid, MenuItem,
  Pagination, Snackbar, Select, SelectChangeEvent, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import * as HttpUtil from "../../../utils/httpUtil";
import * as ProductContract from "../../../../backend/contract/stock/product";

export default function HomePage({searchParams }: { searchParams: { keyword: string } }) {
  const [pageError, setPageError] = React.useState("");
  const router = useRouter();
  const [isLoadingResult, setIsLoadingResult] = React.useState(true);
  const [keyword, setKeyword] = React.useState("");
  const [searchedKeyword, setSearchedQueryKeyword] = React.useState("");
  const [sort, setSort] = React.useState(ProductContract.SearchProductOrderBy.Relevance as string);
  const [order, setOrder] = React.useState(HttpUtil.QueryOrder.Desc as string);
  const [pageSize, setPageSize] = React.useState(2);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [products, setProducts] = React.useState([] as ProductContract.SearchProductApiResponseBodyItem[]);

  const pageErrorClose = () => {
    setPageError("");
  };
  
  const fetchProducts = async (
    queryKeyword: string,
    querySort: string, queryOrder:string,
    queryPageSize: number,
    queryPageNumber: number) => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<ProductContract.SearchProductApiResponseBody>(
      `/products?keyword=${queryKeyword}&sort=${querySort}&order=${queryOrder}&offset=${(queryPageNumber - 1) * queryPageSize}&fetch=${queryPageSize}`);

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

  const keywordTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  }

  const keywordTextFieldKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if(event.key === "Enter") {
      setSearchedQueryKeyword(keyword);
      setPageNumber(1);
      fetchProducts(keyword, sort, order, pageSize, 1);
    }
  }

  const searchButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    setSearchedQueryKeyword(keyword);
    setPageNumber(1);
    fetchProducts(keyword, sort, order, pageSize, 1);
  }

  const sortChipClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, buttonText: string) => {
    setSort(buttonText);
    setPageNumber(1);
    fetchProducts(searchedKeyword, buttonText, order, pageSize, 1);
  };

  const orderChipClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, buttonText: string) => {
    setOrder(buttonText);
    setPageNumber(1);
    fetchProducts(searchedKeyword, sort, buttonText, pageSize, 1);
  };

  const fetchSelectChange = async (event: SelectChangeEvent) => {
    setPageSize(Number(event.target.value));
    setPageNumber(1);
    fetchProducts(searchedKeyword, sort, order, Number(event.target.value), 1);
  };

  const paginationChange = async (event: React.ChangeEvent, paginationPage: number) => {
    setPageNumber(paginationPage);
    fetchProducts(searchedKeyword, sort, order, pageSize, paginationPage);
  }

  const productClick = async (event: React.MouseEvent<HTMLButtonElement>, productId: number) => {
    router.push("/products/" + productId);
  }
  
  React.useEffect(() => {
    const queryKeyword: string = searchParams.keyword || "";

    if(queryKeyword !== "") {
      setSearchedQueryKeyword(queryKeyword);
      setKeyword(queryKeyword);
      fetchProducts(queryKeyword, sort, order, pageSize, 1);
    }
    else {
      fetchProducts(searchedKeyword, sort, order, pageSize, 1);
    }
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Box sx={{display: 'flex', width: '100%'}}>
          <Box sx={{flex: 1}}>
            <TextField
              label="Search for a product"
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
          <Box sx={{display: 'flex', flex: 1, mt: 3}}>
            <Box sx={{display: 'flex', gap: 2, alignItems: 'center', mr: 6}}>
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
            <Box sx={{display: 'flex', gap: 2, alignItems: 'center', ml: 'auto'}}>
              <Typography variant="body1">
                Item/Page
              </Typography>
              <Select value={pageSize.toString()} size="small" sx={{width: 64}} onChange={fetchSelectChange}>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={8}>8</MenuItem>
                <MenuItem value={16}>16</MenuItem>
              </Select>
            </Box>
          </Box>
        </Box>
        { !isLoadingResult && products.length > 0 &&          
          <Box sx={{mt: 8, width: '100%'}}>
            <Box>
              <Grid container spacing={{xs: 2, s: 3, md: 4, lg: 5}} columns={{xs: 4, sm: 8, md: 12, lg: 16}}>
                { products.map((item: ProductContract.SearchProductApiResponseBodyItem) => (
                  <Grid item xs={2} sm={4} key={item.id}>                    
                    <Card sx={{ maxWidth: 400 }}>
                      <CardActionArea onClick={(event) => productClick(event, item.id)}>
                        <CardMedia
                          component="img"
                          height="200"
                          image="https://i1.adis.ws/i/ArsenalDirect/jhz2133_f?&$plpImages$" />
                        <CardContent>
                          <Box>
                            <Typography variant="body1" sx={{textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>
                              {item.name}
                            </Typography>
                          </Box>
                          <Box sx={{display: 'flex'}}>
                            <Box sx={{display: 'flex'}}>
                              <Typography variant="body2" color="text.secondary">
                                ${item.unitPrice.toFixed(2)}{item.unitOfMeasureShortName !== "" ? "/" + item.unitOfMeasureShortName : ""}
                              </Typography>
                            </Box>
                            <Box sx={{ml: 'auto'}}>
                              <Typography variant="body2" color="text.secondary">
                              {item.quantitySold} Sold
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
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
        {!isLoadingResult && products.length === 0 &&
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