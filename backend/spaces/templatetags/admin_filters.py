from django import template

register = template.Library()

@register.filter(name='length_is')
def length_is(value, arg):
    """Returns a boolean of whether the value's length is the argument."""
    try:
        return len(value) == int(arg)
    except (ValueError, TypeError):
        return False