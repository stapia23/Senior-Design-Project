package com.CSC492.store.util;
import com.CSC492.store.model.Product;
import java.util.*;

public class ProductAlgorithms {
    // Merge sort for sorting by price, and newest
    // using the divide and conquer approach by splitting the list into two halves
    // and recursively sorting each half and then merging the two sorted halves into one sorted list
    // the recursion the method calls itself to sort smaller and smaller portions.
    // Why we used this because it provides stable sorting 
    // Time complexity: O(n log n)
    public static List<Product> mergeSort(List<Product> list, Comparator<Product> comparator) {
        // this is the base case that if the list has 0 or 1 item, it is already sorted so return it the list as is
        if (list.size() <= 1) {
            return list;
        }

        // get the middle index to split the list into two
        int mid = list.size() / 2;
        
        // recursively sort the left half of the list and using sublist it creates a view of the original list
        List<Product> left = mergeSort(list.subList(0, mid), comparator);
        // does the same for the right half of the list
        List<Product> right = mergeSort(list.subList(mid, list.size()), comparator);

        // merge the two sorted halves into a single sorted list and return it
        return merge(left, right, comparator);
    }

    // made a separate method for the merge, for merging the two sorted lists into one sorted list
    private static List<Product> merge(List<Product> left, List<Product> right, Comparator<Product> comparator) {
        // this will hold the final sorted result
        List<Product> result = new ArrayList<>();
        
        // this the index for the left list
        int i = 0;
        // and index for the right list, or pointer as well
        int j = 0;

        //loop while both lists still have elements
        while (i < left.size() && j < right.size()) {
            // compare the current elements of both lists using comparator
            // if left[i] is less than or equal to right[j], add left[i]
            if (comparator.compare(left.get(i), right.get(j)) <= 0) {
                // add left[i] to the result list
                // increment the left index to move forward
                result.add(left.get(i++));
            }
            else {
                //right[j] is smaller so add right[j] to the result list
                // increment the right index to move forward
                result.add(right.get(j++));
            }
        }
        //after the loop ends one of the lists may still have leftover elements
        // so add all remaining elements from the left and right lists, if any
        result.addAll(left.subList(i, left.size()));
        result.addAll(right.subList(j, right.size()));

        // return the merged and sorted list
        return result;
    }

    // Binary Search for search keyword
    // Why we used this
    // because it works efficiently to find products by name and we use it when users types a search keyword
    // beofre the list already sorted the products alphabetically, for sorting O(n log n)
    // then uses binary search to find matching names, this is O(log n)
    // and then get all matches
    // Time complexity: O(n log n)
    public static List<Product> binarySearch(List<Product> list, String keyword) {
        // this will store all matching products found during the search
        List<Product> results = new ArrayList<>();
        // convert the search keyword to lowercase for case insensitive comparing
        keyword = keyword.toLowerCase();

        // left index pointer for the binary search being the start of the list
        int left = 0;
        // right index pointer for the binary search being the end of the list
        int right = list.size() - 1;

        // continue to loop and search while the search range is valid
        while (left <= right) {
            // get the middle index of the current search range
            int mid = (left + right) / 2;
            // get the product located at that middle index
            Product p = list.get(mid);

            //here compare the lowercase product name with keyword
            // negative for less than, positive for greater than, or 0 for equal
            int compare = p.getName().toLowerCase().compareTo(keyword);
            
            // if compare == 0 then the product name exactly matches the keyword
            if (compare == 0) {
                // add the middle product to the results
                results.add(p);

                // search left of middle for any other matching products
                int i = mid - 1;
                // loop moving left while product names contain the keyword
                // this will catch multiple products that match the keyword
                while (i >= 0 && list.get(i).getName().toLowerCase().contains(keyword)) {
                    // add product and decrement move left
                    results.add(list.get(i--));
                }

                // search right of middle for any other matching products
                int j = mid + 1;
                // loop moving right while product names contain the keyword
                while (j < list.size() && list.get(j).getName().toLowerCase().contains(keyword)) {
                    // add product and increment move right
                    results.add(list.get(j++));
                }
                // return all the matches found
                return results;
            }
            // if compare < 0 then product name comes alphabetically before the keyword
            // so the match must be in the right half
            if (compare < 0) {
                // so move the left index pointer to narrow the search
                left = mid + 1;
            }
            // if compare > 0 then product name comes after keyword
            // so the match must be in the left half
            else {
                // so move the right index pointer to narrow the search
                right = mid - 1;
            }
        }
        // return result of the matchs, if no matches then returns empty list
        return results;
    }
}