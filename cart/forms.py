# cart/forms.py
from django import forms

class AddToCartForm(forms.Form):
    # Ô nhập số lượng
    quantity = forms.IntegerField(
        min_value=1,
        initial=1,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )
    
    # Ô nhập size giày
    size = forms.IntegerField(
        min_value=30,
        max_value=50,
        widget=forms.NumberInput(attrs={'class': 'form-control'})
    )