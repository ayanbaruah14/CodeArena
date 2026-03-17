#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, k;
    cin >> n >> k;
    
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    
    // min heap of size k
    priority_queue<int, vector<int>, greater<int>> pq;
    
    for (int i = 0; i < n; i++) {
        pq.push(arr[i]);
        if (pq.size() > k) pq.pop();
    }
    
    cout << pq.top() << endl;
    return 0;
}